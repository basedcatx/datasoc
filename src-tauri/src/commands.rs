use std::num::NonZeroU32;
use std::{collections::HashMap, vec};

use crate::db::{bm25_search, rrf_fuse, vector_search};
use crate::embedding::{batch_decode, normalize};
use crate::AppState;
use llama_cpp::sys::context::params::LlamaContextParams;
use llama_cpp::sys::llama_batch::LlamaBatch;
use llama_cpp::sys::token;
use serde::{Deserialize, Serialize};
use sql::rusqlite;
use sql::zerocopy::IntoBytes as AsBytes;
use tauri::State;

const K_RRF: u32 = 60;

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordSearch {
    id: u32,
    name: String,
    content: String,
    content_html: String,
    tags: Tags,
    flags: u32,
    meta: Meta,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordInsert {
    name: String,
    content: String,
    content_html: String,
    tags: Tags,
    flags: u32,
    meta: Meta,
    embedding: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordUpdate {
    id: u32,
    name: String,
    content: String,
    content_html: String,
    tags: Tags,
    flags: u32,
    meta: Meta,
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

#[tauri::command]
pub async fn get_embedding(input: String, state: State<'_, AppState>) -> Result<Vec<f32>, String> {
    let model = state.engine.model.lock().map_err(|e| e.to_string())?;

    let ctx_params = LlamaContextParams::default()
        .with_embeddings(true)
        .with_pooling_type(llama_cpp::sys::context::params::LlamaPoolingType::Mean)
        .with_n_ctx(NonZeroU32::new(2048))
        .with_n_batch(2048)
        .with_n_ubatch(2048);

    let mut ctx = model
        .new_context(&state.engine.backend, ctx_params)
        .map_err(|_| "Failed to create llama context")?;

    let n_ctx = ctx.n_ctx() as usize;

    let mut token_list = model.vocab().tokenize(input.as_bytes(), true, true);

    token_list.truncate(n_ctx);

    if token_list.is_empty() {
        return Err("Requies an input tokenn".to_string());
    }

    let mut output = Vec::with_capacity(1);

    let mut batch = LlamaBatch::new(n_ctx, 1);

    batch
        .add_sequence(&token_list, 0, false)
        .map_err(|e| e.to_string())?;
    batch_decode(&mut ctx, &mut batch, 1, &mut output).map_err(|e| e.to_string());

    Ok(output[0].clone())
}

#[tauri::command]
pub async fn create_record(
    input: RecordInsert,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db = state.db.lock().map_err(|_| "Failed to get db lock")?;

    let RecordInsert {
        name,
        content,
        tags,
        flags,
        meta,
        embedding,
        content_html,
    } = &input;

    let tags_string =
        serde_json::to_string(&tags).map_err(|_| "Failed to convert tags too string")?;
    let meta_string =
        serde_json::to_string(&meta).map_err(|_| "Failed to convert meta to string")?;

    let res = db
        .execute(
            "INSERT INTO Records(name, content, tags, flags, meta, content_html ) VALUES(?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![&name, &content, &tags_string, &flags, &meta_string, &content_html],
        )
        .map_err(|e| format!("An error occurred while executing query: {e}"))?;

    let id = db.last_insert_rowid();

    let vec_res = db
        .execute(
            "INSERT OR REPLACE INTO RecordEmbedding(rowid, embedding) VALUES(?1, ?2)",
            rusqlite::params![&id, &embedding.as_bytes()],
        )
        .map_err(|e| format!("An error occurred while executing query {e}"))?;

    Ok(res > 0 && vec_res > 0)
}

#[tauri::command]
pub async fn fetch_records(state: State<'_, AppState>) -> Result<Vec<RecordSearch>, String> {
    let db = state
        .db
        .lock()
        .map_err(|e| format!("db lock poisoned {e}"))?;

    let mut stmt = db
        .prepare("SELECT name, content, tags, flags, meta, content_html, createdAt, updatedAt, id FROM Records")
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
                id: row.get(8)?,
                name: row.get(0)?,
                content: row.get(1)?,
                tags,
                flags: row.get(3)?,
                meta,
                content_html: row.get(5)?, // left as a placeholder
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
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
        .prepare("SELECT name, content, tags, flags, meta, content_html, createdAt, updatedAt, id FROM Records WHERE id = ?1")
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
                id: row.get(8)?,
                name: row.get(0)?,
                content: row.get(1)?,
                tags,
                flags: row.get(3)?,
                meta,
                content_html: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
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
        .prepare("SELECT name, content, tags, flags, meta, content_html, createdAt, updatedAt, id FROM Records WHERE UPPER(name) LIKE UPPER(?1)")
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
                id: row.get(8)?,
                name: row.get(0)?,
                content: row.get(1)?,
                tags,
                flags: row.get(3)?,
                meta,
                content_html: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
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
    let db = state.db.lock().map_err(|_| "Failed to get db lock")?;

    let RecordUpdate {
        id,
        name,
        content,
        tags,
        flags,
        meta,
        content_html,
        embedding,
    } = &input;

    let tags_string =
        serde_json::to_string(&tags).map_err(|_| "Failed to convert tags too string")?;
    let meta_string =
        serde_json::to_string(&meta).map_err(|_| "Failed to convert meta to string")?;

    let res = db
        .execute(
            "UPDATE Records SET name = ?1, content = ?2, tags = ?3, flags = ?4, meta = ?5, content_html = ?7  WHERE id = ?6",
            rusqlite::params![&name, &content, &tags_string, &flags, &meta_string, &id, &content_html ],
        )
        .map_err(|e| format!("An error occurred while executing query: {e}"))?;

    let vec_res = db
        .execute(
            "UPDATE RecordEmbedding SET embedding = ?2 WHERE rowid = ?1",
            rusqlite::params![&id, &embedding.as_bytes()],
        )
        .map_err(|e| format!("An error occurred while executing query {e}"))?;

    Ok(res > 0 && vec_res > 0)
}

#[tauri::command]
pub async fn delete_record(input: u32, state: State<'_, AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|_| "Failed to get db lock")?;

    let res = db
        .execute(
            "DELETE FROM Records WHERE id = ?1",
            rusqlite::params![&input],
        )
        .map_err(|e| format!("An error occurred while executing query: {e}"))?;

    let vec_res = db
        .execute(
            "DELETE FROM RecordEmbedding WHERE rowid = ?1",
            rusqlite::params![input],
        )
        .map_err(|e| format!("Failed to execute embedding query: {e}"))?;

    Ok(res > 0 && vec_res > 0)
}

#[tauri::command]
pub async fn hybrid_search(
    input: SearchInput,
    state: State<'_, AppState>,
) -> Result<Vec<RecordSearch>, String> {
    let conn = state.db.lock().map_err(|e| "Failed to acquire db lock")?;

    let bm25_res = bm25_search(&conn, &input.text, input.limit).map_err(|e| e.to_string())?;
    let vec_res = vector_search(&conn, &input.embedding, input.limit).map_err(|e| e.to_string())?;

    let fused = rrf_fuse(&bm25_res, &vec_res, K_RRF);

    let mut stmt = conn
        .prepare("SELECT name, content, tags, flags, meta, content_html, createdAt, updatedAt, id FROM Records WHERE id = ?1")
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
                id: row.get(8)?,
                name: row.get(0)?,
                content: row.get(1)?,
                tags,
                flags: row.get(3)?,
                meta,
                content_html: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            });

            Ok(())
        })
        .map_err(|e| e.to_string())?;
    }

    Ok(res)
}

// backup
