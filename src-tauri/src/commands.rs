use std::collections::HashMap;

use crate::embedding::normalize;
use crate::AppState;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_batch::LlamaBatch;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use zerocopy::IntoBytes as AsBytes;

#[derive(Serialize, Deserialize, Debug)]
pub struct Record {
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
        batch.add(token, i as i32, &[0], is_last).unwrap();
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
pub async fn create_record(input: Record, state: State<'_, AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|_| "Failed to get db lock")?;

    let Record {
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
        .map_err(|e| format!("An error occurred while executing query: {}", e.to_string()))?;

    let id = db.last_insert_rowid();

    let vec_res = db
        .execute(
            "INSERT INTO RecordEmbedding VALUES(?1, ?2)",
            rusqlite::params![&id, &embedding.as_bytes()],
        )
        .map_err(|e| format!("An error occurred while executing query: {}", e.to_string()))?;

    Ok(res > 0 && vec_res > 0)
}
