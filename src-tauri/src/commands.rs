use std::{collections::HashMap, vec};

use crate::embedding::normalize;
use crate::AppState;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_batch::LlamaBatch;
use serde::{Deserialize, Serialize};
use tauri::State;
use zerocopy::IntoBytes as AsBytes;

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordSearch {
    name: String,
    content: String,
    tags: Tags,
    flags: u32,
    meta: Meta,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecordInsert {
    name: String,
    content: String,
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
    tags: Tags,
    flags: u32,
    meta: Meta,
    embedding: Vec<f32>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Tags(Vec<String>);

#[derive(Serialize, Deserialize, Debug)]
struct Meta(HashMap<String, String>);

#[tauri::command]
pub async fn get_embedding(input: String, state: State<'_, AppState>) -> Result<Vec<f32>, String> {
    let model = state.engine.model.lock().map_err(|e| e.to_string())?;
    let ctx_params = LlamaContextParams::default().with_embeddings(true);
    let mut ctx = model
        .new_context(&state.engine.backend, ctx_params)
        .map_err(|_| "Failed to create llama context")?;
    let mut tokens = model
        .str_to_token(&input, llama_cpp_2::model::AddBos::Always)
        .map_err(|e| e.to_string())?;

    let n_ctx = ctx.n_ctx() as usize;

    if tokens.len() > n_ctx {
        tokens.truncate(n_ctx);
    }

    if tokens.is_empty() {
        return Err("Requies an input tokenn".to_string());
    }

    let mut batch = LlamaBatch::new(tokens.len(), 1);

    for (i, &token) in tokens.iter().enumerate() {
        let is_last = i == tokens.len() - 1;
        batch
            .add(token, i as i32, &[0], is_last)
            .map_err(|e| e.to_string())?;
    }

    ctx.clear_kv_cache();
    ctx.encode(&mut batch)
        .map_err(|_| "Failed to execute encode pass".to_string())?;

    let raw_embedding = ctx
        .embeddings_ith(0)
        .map_err(|_| "Failed to extract embedding vector".to_string())?;

    Ok(normalize(raw_embedding))
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
        ..
    } = &input;

    let tags_string =
        serde_json::to_string(&tags).map_err(|_| "Failed to convert tags too string")?;
    let meta_string =
        serde_json::to_string(&meta).map_err(|_| "Failed to convert meta to string")?;

    let res = db
        .execute(
            "INSERT INTO Records(name, content, tags, flags, meta ) VALUES(?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![&name, &content, &tags_string, &flags, &meta_string],
        )
        .map_err(|e| format!("An error occurred while executing query: {e}"))?;

    let id = db.last_insert_rowid();

    let vec_res = db
        .execute(
            "INSERT INTO RecordEmbedding VALUES(?1, ?2)",
            rusqlite::params![&id, &embedding.as_bytes()],
        )
        .map_err(|e| format!("An error occurred while executing query {e}"))?;

    Ok(res > 0 && vec_res > 0)
}

#[tauri::command]
pub async fn read_records(state: State<'_, AppState>) -> Result<Vec<RecordSearch>, String> {
    let db = state
        .db
        .lock()
        .map_err(|e| format!("db lock poisoned {e}"))?;

    let mut stmt = db
        .prepare("SELECT name, content, tags, flags, meta FROM Records")
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
                name: row.get(0)?,
                content: row.get(1)?,
                tags,
                flags: row.get(3)?,
                meta,
                // left as a placeholder
            })
        })
        .map_err(|e| e.to_string())?;

    let records = record_iter
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    Ok(records)
}

#[tauri::command]
pub async fn update_record(
    input: RecordUpdate,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let db = state
        .db
        .lock()
        .map_err(|e| format!("db lock poisoned {e}"))?;

    let mut stmt = db
        .prepare("SELECT name, content, tags, flags, meta FROM Records")
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

            Ok(Record {
                name: row.get(0)?,
                content: row.get(1)?,
                tags,
                flags: row.get(3)?,
                meta,
                // left as a placeholder
                embedding: vec![0.0],
            })
        })
        .map_err(|e| e.to_string())?;

    let records = record_iter
        .collect::<rusqlite::Result<Vec<_>>>()
        .map_err(|e| e.to_string())?;

    Ok(records)
}
