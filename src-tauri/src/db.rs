use std::path::PathBuf;

use anyhow::Context;
use rusqlite::{ffi::sqlite3_auto_extension, Connection};
use rusqlite_migration::{Migrations, M};
use sqlite_vec::sqlite3_vec_init;

pub fn init(db_path: &mut PathBuf) -> anyhow::Result<Connection> {
    unsafe {
        sqlite3_auto_extension(Some(std::mem::transmute(sqlite3_vec_init as *const ())));
    }

    std::fs::create_dir_all(&db_path)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e));

    db_path.push("db/appdata.db");

    let mut conn = Connection::open(db_path).context("Failed to open db")?;

    println!("Connection to sqlite database established {conn:?}");

    conn.pragma_update_and_check(None, "journal_mode", &"WAL", |_| Ok(()))
        .unwrap();

    let migrations = Migrations::new(vec![
                    M::up("CREATE TABLE Records (id INTEGER PRIMARY KEY, name TEXT NOT NULL, content TEXT NOT NULL, meta TEXT DEFAULT \"{}\", tags TEXT DEFAULT \"[]\", flags INTEGER DEFAULT 0, createdAt DATE DEFAULT (strftime('%Y-%m-%dT%H-%M-%SZ', 'now')), updatedAt TEXT Default (strftime('%Y-%m-%dT%H-%M-%SZ', 'now'));"),
                    M::up("CREATE VIRTUAL TABLE FullSearch USING fts5(content, content='Records', content_rowid='id')"),
                    M::up("CREATE VIRTUAL TABLE RecordEmbedding USING vec0(record_id integer partition key, embedding float[384])")
                ]);

    migrations
        .to_latest(&mut conn)
        .context("Failed to load database migrations")?;

    Ok(conn)
}
