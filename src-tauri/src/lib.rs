use sqlite_vec::sqlite3_vec_init;
use tauri::{Manager, State};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let model_path = app
                .path()
                .resolve("res/minilm-l6.gguf", tauri::path::BaseDirectory::Resource)?;

            let mut db_path = app.path().app_local_data_dir()?;
            fs::create_dir_all(&db_path)?;
            db_path.push("db/appdata.db");
            

            println!("Booting LlamaBackend & loading model from {:?}", model_path);

            let engine = EmbeddingEngine::new(model_path)
                .expect("Failed to initialize embedding model on boot");

                unsafe {
                    sqlite3_auto_extension(Some(std::mem::transmute(sqlite3_vec_init as *const ())));
                }


                let mut conn = Connection::open(db_path).expect("Failed to open db");

                             println!("Connection to sqlite database established {conn:?}");

                conn.pragma_update_and_check(None, "journal_mode", &"WAL", |_| Ok(())).unwrap();

                let migrations = Migrations::new(vec![
                    M::up("CREATE TABLE Records (id INTEGER PRIMARY KEY, name TEXT NOT NULL, content TEXT NOT NULL, meta TEXT DEFAULT \"{}\", tags TEXT DEFAULT \"[]\", flags INTEGER DEFAULT 0, createdAt DATE DEFAULT (strftime('%Y-%m-%dT%H-%M-%SZ', 'now')), updatedAt TEXT Default (strftime('%Y-%m-%dT%H-%M-%SZ', 'now'));"),
                    M::up("CREATE VIRTUAL TABLE FullSearch USING fts5(content, content='Records', content_rowid='id')"),
                    M::up("CREATE VIRTUAL TABLE RecordEmbedding USING vec0(record_id integer partition key, embedding float[384])")
                ]);


                migrations.to_latest(&mut conn).map_err(|_| "Failed to run db migrations")?;


            app.manage(AppState {
                engine,
                db: std::sync::Mutex::new(conn)
            });

            Ok(())
        }).invoke_handler(tauri::generate_handler![get_embedding])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use llama_cpp_2::{
    context::params::LlamaContextParams,
    llama_backend::LlamaBackend,
    llama_batch::LlamaBatch,
    model::{params::LlamaModelParams, LlamaModel},
};

use rusqlite::{ffi::sqlite3_auto_extension, Connection, Result};
use rusqlite_migration::{Migrations, M};
use std::{fs, path::Path};
use std::sync::Mutex;

struct EmbeddingEngine {
    pub backend: LlamaBackend,
    pub model: Mutex<LlamaModel>,
}

impl EmbeddingEngine {
    pub fn new<P: AsRef<Path>>(model_path: P) -> anyhow::Result<Self> {
        let backend = LlamaBackend::init()?;
        let model_params = std::pin::pin!(LlamaModelParams::default());
        let model = LlamaModel::load_from_file(&backend, model_path, &model_params)
            .map_err(|_| anyhow::anyhow!("Failed to load GGUF from file"))?;
        Ok(Self {
            backend,
            model: Mutex::new(model),
        })
    }
}

pub struct AppState {
    engine: EmbeddingEngine,
    db: std::sync::Mutex<Connection>,
}

// utils

fn normalize(inputs: &[f32]) -> Vec<f32> {
    //l2 normalization
    let mag = inputs
        .iter()
        .fold(0.0, |acc, &val| val.mul_add(val, acc))
        .sqrt();

    if mag == 0.0 {
        return inputs.to_vec();
    }

    return inputs.iter().map(|&i| i / mag).collect();
}

#[tauri::command]
async fn get_embedding(input: String, state: State<'_, AppState>) -> Result<Vec<f32>, String> {
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
