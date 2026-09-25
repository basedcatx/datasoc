use std::{cmp::Ordering, path::PathBuf, sync::MutexGuard};

use anyhow::Context;
use rusqlite::{ffi::sqlite3_auto_extension, Connection};
use rusqlite_migration::{Migrations, M};
use sqlite_vec::sqlite3_vec_init;
use std::collections::HashMap;
use zerocopy::IntoBytes as AsBytes;

pub fn init(db_path: &mut PathBuf) -> anyhow::Result<Connection> {
    unsafe {
        sqlite3_auto_extension(Some(std::mem::transmute(sqlite3_vec_init as *const ())));
    }

    std::fs::create_dir_all(&db_path)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

    db_path.push("db/appdata.db");

    let mut conn = Connection::open(db_path).context("Failed to open db")?;

    println!("Connection to sqlite database established {conn:?}");

    conn.pragma_update_and_check(None, "journal_mode", &"WAL", |_| Ok(()))
        .unwrap();

    let migrations = Migrations::new(vec![
        M::up(
        "CREATE TABLE IF NOT EXISTS Records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            meta TEXT DEFAULT '{}',
            tags TEXT DEFAULT '[]',
            flags INTEGER DEFAULT 0,
            createdAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
            updatedAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );"),

        M::up(
        "CREATE VIRTUAL TABLE IF NOT EXISTS FullSearch USING fts5(
            content,
            content='Records',
            content_rowid='id'
        );

        CREATE TRIGGER IF NOT EXISTS records_ai AFTER INSERT ON Records BEGIN
            INSERT INTO FullSearch(rowid, content) VALUES (new.id, new.content);
        END;

        CREATE TRIGGER IF NOT EXISTS records_ad AFTER DELETE ON Records BEGIN
            INSERT INTO FullSearch(FullSearch, rowid, content) VALUES('delete', old.id, old.content);
        END;

        CREATE TRIGGER IF NOT EXISTS records_au AFTER UPDATE ON Records BEGIN
            INSERT INTO FullSearch(FullSearch, rowid, content) VALUES('delete', old.id, old.content);
            INSERT INTO FullSearch(rowid, content) VALUES (new.id, new.content);
        END;"),

        M::up("CREATE VIRTUAL TABLE IF NOT EXISTS RecordEmbedding USING vec0(embedding float[384])"),

        M::up("ALTER TABLE Records ADD content_html TEXT"),
    ]);

    migrations
        .to_latest(&mut conn)
        .context("Failed to load database migrations")?;

    Ok(conn)
}

fn escape_fts5_query(query: &str) -> String {
    query
        .split_whitespace()
        .map(|term| {
            let escaped = term.replace('"', "\"\"");
            format!("\"{}*\"", escaped)
        })
        .collect::<Vec<_>>()
        .join(" OR ")
}

// Vec<(id, embedding)>
pub fn vector_search(
    conn: &MutexGuard<'_, Connection>,
    query: &[f32],
    limit: u32,
) -> rusqlite::Result<Vec<(u32, f32)>> {
    let mut stmt = conn.prepare("SELECT rowid, distance FROM RecordEmbedding WHERE embedding MATCH ?1 ORDER BY distance LIMIT ?2")?;

    let rows = stmt.query_map(rusqlite::params![query.as_bytes(), limit], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })?;

    rows.collect()
}

/// Vec<(id,  score)>
pub fn bm25_search(
    conn: &MutexGuard<'_, Connection>,
    query: &str,
    limit: u32,
) -> rusqlite::Result<Vec<(u32, f32)>> {
    let escaped = escape_fts5_query(query);
    if escaped.is_empty() {
        return Ok(Vec::new());
    }

    let mut stmt = conn.prepare(
        "SELECT rowid, bm25(FullSearch, 10) FROM FullSearch WHERE FullSearch MATCH ?1 LIMIT ?2",
    )?;

    let rows = stmt.query_map(rusqlite::params![escaped, limit], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })?;

    rows.collect()
}

pub fn rrf_fuse(bm25: &[(u32, f32)], vector: &[(u32, f32)], k_rrf: u32) -> Vec<(u32, f32)> {
    let mut bm25_rank: HashMap<u32, u32> = HashMap::new();
    let mut fused: HashMap<u32, f32> = HashMap::new();

    for (rank, (id, _)) in bm25.iter().enumerate() {
        let _ = bm25_rank.entry(*id).or_insert((rank as u32) + 1);
        *fused.entry(*id).or_insert(0.0) += 1.0 / (k_rrf + (rank as u32) + 1) as f32;
    }

    for (rank, (id, _)) in vector.iter().enumerate() {
        *fused.entry(*id).or_insert(0.0) += 1.0 / (k_rrf + (rank as u32) + 1) as f32;
    }

    // we assume the document was never featured in any list thus it has no rank.
    let worse_case = (bm25.len() + vector.len() + 1) as u32;

    let mut out: Vec<(u32, f32)> = fused.into_iter().collect();
    out.sort_by(|a, b| {
        b.1.partial_cmp(&a.1)
            .unwrap_or(Ordering::Equal)
            .then_with(|| {
                let ra = bm25_rank.get(&a.0).unwrap_or(&worse_case);
                let rb = bm25_rank.get(&b.0).unwrap_or(&worse_case);
                ra.cmp(rb)
            })
            .then_with(|| a.0.cmp(&b.0))
    });

    out
}
