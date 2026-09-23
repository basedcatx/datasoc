use crate::embedding::normalize;
use crate::AppState;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_batch::LlamaBatch;
use tauri::State;

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
