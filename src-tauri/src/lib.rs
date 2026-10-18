mod commands;
mod db;
mod embedding;
use anyhow::Context;
use commands::{
    create_record, delete_record, fetch_record_by_id, fetch_record_by_name, fetch_records,
    get_embedding, hybrid_search, update_record,
};
use s3::{creds::Credentials, Bucket};

#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;
use tauri::{Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_shell::{process::Command, ShellExt};

pub struct AppShell {
    sqlite3: std::sync::Mutex<Command>,
}

pub struct AppState {
    engine: embedding::EmbeddingEngine,
    db: std::sync::Mutex<sql::rusqlite::Connection>,
    shell: AppShell,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
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
                let splash_window = handle
                    .get_webview_window("splashscreen")
                    .expect("No splashscreen found");

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

                let sqlite3_shell = handle
                    .shell()
                    .sidecar("sqlite3")
                    .expect("Couldn't init sqlite3 shell");

                handle.manage(AppState {
                    engine,
                    db: std::sync::Mutex::new(conn),
                    shell: AppShell {
                        sqlite3: std::sync::Mutex::new(sqlite3_shell),
                    },
                });

                let _ = splash_window.close();
                let main_window = handle.get_webview_window("main").unwrap();
                main_window.show();
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
