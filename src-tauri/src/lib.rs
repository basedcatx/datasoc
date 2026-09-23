mod commands;
mod db;
mod embedding;

pub struct AppState {
    engine: embedding::EmbeddingEngine,
    db: std::sync::Mutex<rusqlite::Connection>,
}

use commands::*;
use tauri::{App, Manager};

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

            let mut app_data_path = app
                .path()
                .app_local_data_dir()
                .expect("Cannot access app's local app dir");

            let engine = embedding::init(model_path).expect("Could not load embedding engine");
            let conn =
                db::init(&mut app_data_path).expect("Could not establish database connection");

            app.manage(AppState {
                engine,
                db: std::sync::Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_embedding])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
