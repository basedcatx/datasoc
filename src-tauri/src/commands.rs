use std::num::NonZeroU32;

use crate::db::{bm25_search, rrf_fuse, vector_search};
use crate::embedding::batch_decode;
use crate::AppState;
use llama_cpp::sys::context::params::LlamaContextParams;
use llama_cpp::sys::llama_batch::LlamaBatch;
use serde::{Deserialize, Serialize};
use sql::rusqlite;
use sql::zerocopy::IntoBytes as AsBytes;
use tauri::State;

const K_RRF: u32 = 60;
const FLAG_IS_COMPLETED: u32 = 1 << 2;

#[derive(Serialize, Deserialize, Debug)]
pub struct Record {
    id: u32,
    name: String,
    content: String,
    content_html: String,
    tags: Tags,
    flags: u32,
    meta: Meta,
    record_type: Option<i8>,
    created_at: Option<String>,
    updated_at: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordNew {
    name: String,
    content: String,
    content_html: String,
    record_type: i8,
    tags: Tags,
    flags: u32,
    meta: Meta,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordSearch {
    record: Record,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordInsert {
    record: RecordNew,
    embedding: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordUpdate {
    record: Record,
    embedding: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchInput {
    text: String,
    embedding: Vec<f32>,
    limit: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct Tags(Vec<String>);

#[derive(Serialize, Deserialize, Debug)]
struct Meta(Vec<String>);

fn compute_embedding(
    model: &llama_cpp::sys::model::LlamaModel,
    backend: &llama_cpp::sys::llama_backend::LlamaBackend,
    input: &str,
) -> Result<Vec<f32>, String> {
    let ctx_params = LlamaContextParams::default()
        .with_embeddings(true)
        .with_pooling_type(llama_cpp::sys::context::params::LlamaPoolingType::Mean)
        .with_n_ctx(NonZeroU32::new(2048))
        .with_n_batch(2048)
        .with_n_ubatch(2048);

    let mut ctx = model
        .new_context(backend, ctx_params)
        .map_err(|_| "Failed to create llama context")?;

    let n_ctx = (ctx.n_ctx() as usize).min(model.n_ctx_train() as usize);
    let mut token_list = model.vocab().tokenize(input.as_bytes(), true, true);
    token_list.truncate(n_ctx);
    if token_list.is_empty() {
        return Err("Requires an input token".to_string());
    }

    let mut output = Vec::with_capacity(1);
    let mut batch = LlamaBatch::new(n_ctx, 1);
    batch
        .add_sequence(&token_list, 0, false)
        .map_err(|e| e.to_string())?;
    batch_decode(&mut ctx, &mut batch, 1, &mut output).map_err(|e| e.to_string())?;
    if output.is_empty() {
        return Err("Failed to generate embedding".to_string());
    }
    Ok(output[0].clone())
}

#[tauri::command]
pub async fn get_embedding(input: String, state: State<'_, AppState>) -> Result<Vec<f32>, String> {
    let model = state.engine.model.lock().map_err(|e| e.to_string())?;
    compute_embedding(&model, &state.engine.backend, &input)
}

#[tauri::command]
pub async fn create_record(input: RecordInsert, state: State<'_, AppState>) -> Result<i64, String> {
    let mut db = state.db.lock().map_err(|_| "Failed to get db lock")?;

    let RecordInsert {
        record:
            RecordNew {
                name,
                record_type,
                content,
                content_html,
                flags,
                tags,
                meta,
            },
        embedding,
    } = &input;

    // A PDF is a finished artifact, so it is completed no matter what the
    // caller sent. Keeping the rule here means no upload path can create a
    // draft by forgetting the flag.
    let flags = if *record_type == 1 {
        *flags | FLAG_IS_COMPLETED
    } else {
        *flags
    };

    let tags_string =
        serde_json::to_string(&tags).map_err(|_| "Failed to convert tags too string")?;
    let meta_string =
        serde_json::to_string(&meta).map_err(|_| "Failed to convert meta to string")?;

    let tx = db
        .transaction()
        .map_err(|e| format!("Failed to start transaction {e}"))?;

    tx.execute(
            "INSERT INTO Records(name, content, tags, flags, meta, content_html, record_type ) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![&name, &content, &tags_string, &flags, &meta_string, &content_html, &record_type],
        )
        .map_err(|e| format!("An error occurred while executing query: {e}"))?;

    let id = tx.last_insert_rowid();

    if !embedding.is_empty() {
        tx.execute(
            "INSERT INTO RecordEmbedding(rowid, embedding) VALUES(?1, ?2)",
            rusqlite::params![&id, &embedding.as_bytes()],
        )
        .map_err(|e| format!("An error occurred while executing query {e}"))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction {e}"))?;
    Ok(id)
}

#[tauri::command]
pub async fn fetch_records(state: State<'_, AppState>) -> Result<Vec<RecordSearch>, String> {
    let db = state
        .db
        .lock()
        .map_err(|e| format!("db lock poisoned {e}"))?;

    let mut stmt = db
        // List payloads never need a PDF body, which is base64 and can be
        // hundreds of kilobytes. The viewer fetches the full row by id.
        .prepare("SELECT name, CASE WHEN record_type = 1 THEN '' ELSE content END AS content, tags, flags, meta, content_html, createdAt, updatedAt, id, record_type FROM Records")
        .map_err(|e| e.to_string())?;

    let record_iter = stmt
        .query_map([], |row| {
            let tags_str: String = row.get(2)?;
            let meta_str: String = row.get(4)?;

            let tags: Tags = serde_json::from_str(&tags_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    2,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            let meta: Meta = serde_json::from_str(&meta_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    5,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            Ok(RecordSearch {
                record: Record {
                    id: row.get(8)?,
                    name: row.get(0)?,
                    content: row.get(1)?,
                    tags,
                    flags: row.get(3)?,
                    meta,
                    content_html: row.get(5)?, // left as a placeholder
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    record_type: row.get(9)?,
                },
            })
        })
        .map_err(|e| e.to_string())?;

    let records = record_iter
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    Ok(records)
}

#[tauri::command]
pub async fn fetch_record_by_id(
    input: i32,
    state: State<'_, AppState>,
) -> Result<RecordSearch, String> {
    let db = state
        .db
        .lock()
        .map_err(|e| format!("db lock poisoned {e}"))?;

    let mut stmt = db
        .prepare("SELECT name, content, tags, flags, meta, content_html, createdAt, updatedAt, id, record_type FROM Records WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let record = stmt
        .query_row([&input], |row| {
            let tags_str: String = row.get(2)?;
            let meta_str: String = row.get(4)?;

            let tags: Tags = serde_json::from_str(&tags_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    2,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            let meta: Meta = serde_json::from_str(&meta_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    5,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            Ok(RecordSearch {
                record: Record {
                    id: row.get(8)?,
                    name: row.get(0)?,
                    content: row.get(1)?,
                    tags,
                    flags: row.get(3)?,
                    meta,
                    content_html: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    record_type: row.get(9)?,
                },
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(record)
}

#[tauri::command]
pub async fn fetch_record_by_name(
    input: String,
    state: State<'_, AppState>,
) -> Result<RecordSearch, String> {
    let db = state
        .db
        .lock()
        .map_err(|e| format!("db lock poisoned {e}"))?;

    let mut stmt = db
        .prepare("SELECT name, CASE WHEN record_type = 1 THEN '' ELSE content END AS content, tags, flags, meta, content_html, createdAt, updatedAt, id, record_type FROM Records WHERE UPPER(name) LIKE UPPER(?1)")
        .map_err(|e| e.to_string())?;

    let record = stmt
        .query_row([&input.to_lowercase()], |row| {
            let tags_str: String = row.get(2)?;
            let meta_str: String = row.get(4)?;

            let tags: Tags = serde_json::from_str(&tags_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    2,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            let meta: Meta = serde_json::from_str(&meta_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    5,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            Ok(RecordSearch {
                record: Record {
                    id: row.get(8)?,
                    name: row.get(0)?,
                    content: row.get(1)?,
                    tags,
                    flags: row.get(3)?,
                    meta,
                    content_html: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    record_type: row.get(9)?,
                },
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(record)
}

#[tauri::command]
pub async fn update_record(
    input: RecordUpdate,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut db = state.db.lock().map_err(|_| "Failed to get db lock")?;

    let RecordUpdate {
        record:
            Record {
                name,
                content,
                tags,
                flags,
                record_type: _,
                id,
                meta,
                content_html,
                created_at: _,
                updated_at: _,
            },
        embedding,
    } = &input;

    let tags_string =
        serde_json::to_string(&tags).map_err(|_| "Failed to convert tags too string")?;
    let meta_string =
        serde_json::to_string(&meta).map_err(|_| "Failed to convert meta to string")?;

    let tx = db
        .transaction()
        .map_err(|e| format!("Failed to create transaction {e}"))?;

    let res = tx
        .execute(
            // PDFs are read only. Their content holds the base64 file, so an
            // update must never overwrite it, even if the caller only had a
            // list projection without content.
            "UPDATE Records SET name = ?1,
                content = CASE WHEN record_type = 1 THEN content ELSE ?2 END,
                tags = ?3,
                flags = CASE WHEN record_type = 1 THEN ?4 | 4 ELSE ?4 END,
                meta = ?5,
                content_html = CASE WHEN record_type = 1 THEN content_html ELSE ?7 END
             WHERE id = ?6",
            rusqlite::params![
                &name,
                &content,
                &tags_string,
                &flags,
                &meta_string,
                &id,
                &content_html
            ],
        )
        .map_err(|e| format!("An error occurred while executing query: {e}"))?;

    if res == 0 {
        return Ok(false);
    }

    if !embedding.is_empty() {
        let updated = tx
            .execute(
                "UPDATE RecordEmbedding SET embedding = ?2 WHERE rowid = ?1",
                rusqlite::params![&id, &embedding.as_bytes()],
            )
            .map_err(|e| format!("An error occurred while executing query {e}"))?;
        if updated == 0 {
            tx.execute(
                "INSERT INTO RecordEmbedding(rowid, embedding) VALUES(?1, ?2)",
                rusqlite::params![&id, &embedding.as_bytes()],
            )
            .map_err(|e| format!("An error occurred while executing query {e}"))?;
        }
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction {e}"))?;

    Ok(true)
}

#[tauri::command]
pub async fn delete_record(input: u32, state: State<'_, AppState>) -> Result<bool, String> {
    let mut db = state.db.lock().map_err(|_| "Failed to get db lock")?;

    let tx = db
        .transaction()
        .map_err(|e| format!("Failed to create transaction {e}"))?;

    tx.execute(
        "DELETE FROM Records WHERE id = ?1",
        rusqlite::params![&input],
    )
    .map_err(|e| format!("An error occurred while executing query: {e}"))?;

    tx.execute(
        "DELETE FROM RecordEmbedding WHERE rowid = ?1",
        rusqlite::params![input],
    )
    .map_err(|e| format!("Failed to execute embedding query: {e}"))?;

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction {e}"))?;

    // It is okay if we just return true for now.
    Ok(true)
}

#[tauri::command]
pub async fn hybrid_search(
    input: SearchInput,
    state: State<'_, AppState>,
) -> Result<Vec<RecordSearch>, String> {
    let conn = state.db.lock().map_err(|_| "Failed to acquire db lock")?;

    let bm25_res = bm25_search(&conn, &input.text, input.limit).map_err(|e| e.to_string())?;
    let vec_res = vector_search(&conn, &input.embedding, input.limit).map_err(|e| e.to_string())?;

    let fused = rrf_fuse(&bm25_res, &vec_res, K_RRF);

    // Search results feed cards, so keep the same projection as the list.
    let mut stmt = conn
        .prepare("SELECT name, CASE WHEN record_type = 1 THEN '' ELSE content END AS content, tags, flags, meta, content_html, createdAt, updatedAt, id, record_type FROM Records WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let mut res: Vec<RecordSearch> = Vec::new();
    for (id, _) in fused.into_iter() {
        stmt.query_row([&id], |row| {
            let tags_str: String = row.get(2)?;
            let meta_str: String = row.get(4)?;

            let tags: Tags = serde_json::from_str(&tags_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    2,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            let meta: Meta = serde_json::from_str(&meta_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    5,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;

            res.push(RecordSearch {
                record: Record {
                    id: row.get(8)?,
                    name: row.get(0)?,
                    content: row.get(1)?,
                    tags,
                    flags: row.get(3)?,
                    meta,
                    content_html: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                    record_type: row.get(9)?,
                },
            });

            Ok(())
        })
        .map_err(|e| e.to_string())?;
    }

    Ok(res)
}

// backup

#[derive(Serialize, Deserialize, Debug)]
pub struct ExportBundle {
    pub version: u32,
    pub records: Vec<Record>,
}

#[tauri::command]
pub async fn export_records(state: State<'_, AppState>) -> Result<String, String> {
    let db = state
        .db
        .lock()
        .map_err(|e| format!("db lock poisoned {e}"))?;
    let mut stmt = db
        .prepare("SELECT id, name, content, content_html, tags, flags, meta, record_type, createdAt, updatedAt FROM Records")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let tags_str: String = row.get(4)?;
            let meta_str: String = row.get(6)?;
            let tags: Tags = serde_json::from_str(&tags_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    4,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;
            let meta: Meta = serde_json::from_str(&meta_str).map_err(|e| {
                rusqlite::Error::FromSqlConversionFailure(
                    6,
                    rusqlite::types::Type::Text,
                    Box::new(e),
                )
            })?;
            Ok(Record {
                id: row.get(0)?,
                name: row.get(1)?,
                content: row.get(2)?,
                content_html: row.get(3)?,
                tags,
                flags: row.get(5)?,
                meta,
                record_type: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let records = rows
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;
    let bundle = ExportBundle {
        version: 1,
        records,
    };
    serde_json::to_string(&bundle).map_err(|e| e.to_string())
}

#[derive(Serialize, Deserialize, Debug)]
struct ImportBundle {
    version: Option<u32>,
    records: Vec<Record>,
}

#[tauri::command]
pub async fn import_records(json: String, state: State<'_, AppState>) -> Result<u32, String> {
    let bundle: ImportBundle =
        serde_json::from_str(&json).map_err(|e| format!("Invalid export file: {e}"))?;
    let mut imported: u32 = 0;
    for rec in bundle.records {
        let name = rec.name;
        let content = rec.content;
        let content_html = rec.content_html;
        let record_type = rec.record_type.unwrap_or(0);
        let flags = rec.flags;
        let tags_string = serde_json::to_string(&rec.tags).map_err(|e| e.to_string())?;
        let meta_string = serde_json::to_string(&rec.meta).map_err(|e| e.to_string())?;

        let search_text = if record_type == 1 {
            name.clone()
        } else {
            format!("{}\n{}", name, content)
        };
        let embedding = {
            let model = state.engine.model.lock().map_err(|e| e.to_string())?;
            compute_embedding(&model, &state.engine.backend, &search_text).unwrap_or_default()
        };

        let mut db = state.db.lock().map_err(|_| "Failed to get db lock")?;
        let tx = db
            .transaction()
            .map_err(|e| format!("Failed to start transaction {e}"))?;
        tx.execute(
            "INSERT INTO Records(name, content, tags, flags, meta, content_html, record_type) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![&name, &content, &tags_string, &flags, &meta_string, &content_html, &record_type],
        ).map_err(|e| format!("Insert failed: {e}"))?;
        let id = tx.last_insert_rowid();
        if !embedding.is_empty() {
            tx.execute(
                "INSERT INTO RecordEmbedding(rowid, embedding) VALUES(?1, ?2)",
                rusqlite::params![&id, &embedding.as_bytes()],
            )
            .map_err(|e| format!("Embedding insert failed: {e}"))?;
        }
        tx.commit().map_err(|e| format!("Commit failed: {e}"))?;
        imported += 1;
    }
    Ok(imported)
}
