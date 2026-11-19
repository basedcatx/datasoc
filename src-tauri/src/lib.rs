mod backup;
mod commands;
mod db;
mod embedding;
use anyhow::Context;
use backup::{
    cancel_restore, create_backup, get_backup_status, prepare_restore, restore_backup,
    retry_backup, BackupService,
};
use commands::{
    create_record, delete_record, export_records, fetch_record_by_id, fetch_record_by_name,
    fetch_records, get_embedding, hybrid_search, import_records, update_record,
};

use std::sync::{Arc, Mutex};
use std::time::Duration;
#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_shell::{process::Command, ShellExt};

pub struct AppShell {
    sqlite3: std::sync::Mutex<Command>,
}

pub struct AppState {
    engine: embedding::EmbeddingEngine,
    db: Arc<Mutex<sql::rusqlite::Connection>>,
    backup: Arc<BackupService>,
    shell: AppShell,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if cfg!(debug_assertions) {
        let env_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .map(|path| path.join(".env"))
            .expect("Tauri manifest directory has no project parent");
        if let Err(error) = dotenvy::from_path(env_path) {
            log::warn!("Could not load the development .env file: {error}");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if !cfg!(debug_assertions) {
                let env_path = app
                    .path()
                    .resolve(".env", tauri::path::BaseDirectory::Resource)?;
                dotenvy::from_path(env_path)?;
            }

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
                let model_path = handle
                    .path()
                    .resolve("res/minilm-l6.gguf", tauri::path::BaseDirectory::Resource)
                    .expect("Failed to initialize vector embedding");

                let db_path = handle
                    .path()
                    .resolve("db/appdata.db", tauri::path::BaseDirectory::AppData)
                    .expect("Failed to load database engine");
                let app_data_dir = handle
                    .path()
                    .app_data_dir()
                    .expect("Failed to resolve app data directory");

                let engine = embedding::init(model_path).expect("Could not load embedding engine");

                let conn = db::init(&db_path).expect("Could not establish database connection");
                let backup = Arc::new(
                    BackupService::new(
                        app_data_dir.join("backup-temp"),
                        app_data_dir.join("backup-state.json"),
                    )
                    .expect("Could not initialize backup service"),
                );
                backup
                    .initialize(&conn)
                    .expect("Could not inspect local database for backup status");

                let sqlite3_shell = handle
                    .shell()
                    .sidecar("sqlite3")
                    .expect("Couldn't init sqlite3 shell");

                handle.manage(AppState {
                    engine,
                    db: Arc::new(Mutex::new(conn)),
                    backup: backup.clone(),
                    shell: AppShell {
                        sqlite3: std::sync::Mutex::new(sqlite3_shell),
                    },
                });

                let backup_handle = handle.clone();
                tauri::async_runtime::spawn(async move {
                    let mut interval = tokio::time::interval(Duration::from_secs(30));
                    loop {
                        interval.tick().await;
                        let state = backup_handle.state::<AppState>();
                        let service = state.backup.clone();
                        let db = state.db.clone();
                        drop(state);

                        match service.is_due() {
                            Ok(true) => {
                                let previous = service.status().ok();
                                if let Err(error) = service.create_backup(&db, false).await {
                                    log::error!("Automatic backup failed: {error}");
                                }
                                if let Ok(status) = service.status() {
                                    if previous.as_ref() != Some(&status) {
                                        if let Err(error) =
                                            backup_handle.emit("backup-status", status)
                                        {
                                            log::error!(
                                                "Could not notify the UI about backup status: {error}"
                                            );
                                        }
                                    }
                                }
                            }
                            Ok(false) => {}
                            Err(error) => log::error!("Could not check automatic backup status: {error}"),
                        }
                    }
                });

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
            hybrid_search,
            export_records,
            import_records,
            get_backup_status,
            create_backup,
            prepare_restore,
            cancel_restore,
            restore_backup,
            retry_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
