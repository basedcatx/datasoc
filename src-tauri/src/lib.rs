mod commands;
mod db;
mod embedding;

pub struct AppState {
    engine: embedding::EmbeddingEngine,
    db: std::sync::Mutex<sql::rusqlite::Connection>,
}

use commands::*;
#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;
use tauri::{Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle()
                    .plugin(
                        tauri_plugin_log::Builder::default()
                            .level(log::LevelFilter::Info)
                            .build(),
                    )
                    .expect("Failed to initialize app");
            }

            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let splash_window = handle.get_webview_window("splashscreen").unwrap();

                let model_path = handle
                    .path()
                    .resolve("res/minilm-l6.gguf", tauri::path::BaseDirectory::Resource)
                    .expect("Failed to initialize vector embedding");

                let db_path = handle
                    .path()
                    .resolve("db/appdata.db", tauri::path::BaseDirectory::Resource)
                    .expect("Failed to load database engine");

                let engine = embedding::init(model_path).expect("Could not load embedding engine");

                let conn = db::init(&db_path).expect("Could not establish database connection");

                handle.manage(AppState {
                    engine,
                    db: std::sync::Mutex::new(conn),
                });

                let main_window = handle.get_webview_window("main").unwrap();
                splash_window.close().unwrap();
                main_window.show().unwrap();
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_embedding,
            create_record,
            fetch_records,
            fetch_record_by_name,
            fetch_record_by_id,
            update_record,
            delete_record,
            hybrid_search
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
