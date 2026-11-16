use s3::{creds::Credentials, Bucket, Region};
use serde::{Deserialize, Serialize};
use sql::rusqlite::{backup::Backup, Connection, OpenFlags, OptionalExtension};
use std::{
    env, fs,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Mutex,
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};

const BUCKET_NAME: &str = "hans-record-backup";
const BACKUP_PREFIX: &str = "appdata-";
const BACKUP_SUFFIX: &str = ".backup.db";
const MAX_BACKUPS: usize = 10;
const DEBOUNCE_MS: u128 = 5 * 60 * 1000;
const RETRY_MS: u128 = 60 * 1000;
static TEMP_SEQUENCE: AtomicU64 = AtomicU64::new(0);

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordSummary {
    pub count: u64,
    pub latest_record: Option<RecentRecord>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentRecord {
    pub id: i64,
    pub name: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
#[serde(default, rename_all = "camelCase")]
pub struct BackupStatus {
    pub configured: bool,
    pub last_backup_at: Option<String>,
    pub last_error: Option<String>,
    pub pending_backup: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestorePreview {
    pub backup_key: String,
    pub local: RecordSummary,
    pub backup: RecordSummary,
}

#[derive(Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase")]
struct PersistedState {
    status: BackupStatus,
    backed_up_summary: Option<RecordSummary>,
    dirty_since_ms: Option<u128>,
    last_attempt_ms: Option<u128>,
    revision: u64,
}

pub struct BackupService {
    temp_dir: PathBuf,
    state_path: PathBuf,
    state: Mutex<PersistedState>,
    pending_restore: Mutex<Option<(String, PathBuf)>>,
    uploading: AtomicBool,
}

impl BackupService {
    pub fn new(temp_dir: PathBuf, state_path: PathBuf) -> Result<Self, String> {
        fs::create_dir_all(&temp_dir)
            .map_err(|e| format!("Could not create backup temp directory: {e}"))?;

        let persisted = match fs::read_to_string(&state_path) {
            Ok(contents) => serde_json::from_str(&contents)
                .map_err(|e| format!("Could not read backup status file: {e}"))?,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => PersistedState::default(),
            Err(error) => return Err(format!("Could not read backup status file: {error}")),
        };

        Ok(Self {
            temp_dir,
            state_path,
            state: Mutex::new(persisted),
            pending_restore: Mutex::new(None),
            uploading: AtomicBool::new(false),
        })
    }

    pub fn initialize(&self, db: &Connection) -> Result<(), String> {
        let summary = summarize(db)?;
        let now = now_ms();
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        state.status.configured = is_configured();
        if state.backed_up_summary.as_ref() != Some(&summary) && state.dirty_since_ms.is_none() {
            state.dirty_since_ms = Some(now);
        }
        state.status.pending_backup = state.dirty_since_ms.is_some();
        persist_state(&self.state_path, &state);
        Ok(())
    }

    pub fn status(&self) -> Result<BackupStatus, String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        state.status.configured = is_configured();
        Ok(state.status.clone())
    }

    pub fn mark_dirty(&self) {
        if let Ok(mut state) = self.state.lock() {
            state.revision = state.revision.wrapping_add(1);
            state.dirty_since_ms = Some(now_ms());
            state.last_attempt_ms = None;
            state.status.pending_backup = true;
            persist_state(&self.state_path, &state);
        } else {
            log::error!("Could not mark the database as needing a backup");
        }
    }

    pub fn is_due(&self) -> Result<bool, String> {
        let state = self.state.lock().map_err(|e| e.to_string())?;
        let Some(dirty_since) = state.dirty_since_ms else {
            return Ok(false);
        };
        let now = now_ms();
        let debounce_elapsed = now.saturating_sub(dirty_since) >= DEBOUNCE_MS;
        let retry_elapsed = state.last_attempt_ms.map_or(true, |last_attempt| {
            now.saturating_sub(last_attempt) >= RETRY_MS
        });
        Ok(debounce_elapsed && retry_elapsed && !self.uploading.load(Ordering::Acquire))
    }

    pub fn retry_now(&self) -> Result<(), String> {
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        if state.dirty_since_ms.is_some() {
            state.last_attempt_ms = None;
            persist_state(&self.state_path, &state);
        }
        Ok(())
    }

    pub async fn create_backup(
        &self,
        db: &Mutex<Connection>,
        force: bool,
    ) -> Result<String, String> {
        if self
            .uploading
            .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .is_err()
        {
            return Err("A backup is already in progress".to_string());
        }

        let result = self.create_backup_inner(db, force).await;
        self.uploading.store(false, Ordering::Release);
        result
    }

    async fn create_backup_inner(
        &self,
        db: &Mutex<Connection>,
        force: bool,
    ) -> Result<String, String> {
        if !force && !self.is_due()? {
            return Err("No automatic backup is due".to_string());
        }

        let (snapshot_path, summary, revision) = match self.create_snapshot(db) {
            Ok(snapshot) => snapshot,
            Err(error) => {
                self.record_failure(&error);
                return Err(error);
            }
        };

        let upload_result = self.upload_snapshot(&snapshot_path).await;
        remove_temp_file(&snapshot_path);

        match upload_result {
            Ok(key) => {
                self.record_success(summary, revision);
                Ok(key)
            }
            Err(error) => {
                self.record_failure(&error);
                Err(error)
            }
        }
    }

    fn create_snapshot(
        &self,
        db: &Mutex<Connection>,
    ) -> Result<(PathBuf, RecordSummary, u64), String> {
        let connection = db.lock().map_err(|e| e.to_string())?;
        let summary = summarize(&connection)?;
        let revision = self.state.lock().map_err(|e| e.to_string())?.revision;
        let path = temporary_path(&self.temp_dir, "snapshot");
        if let Err(error) = connection.execute("VACUUM INTO ?1", [path.to_string_lossy().as_ref()])
        {
            remove_temp_file(&path);
            return Err(format!("Could not create SQLite snapshot: {error}"));
        }
        Ok((path, summary, revision))
    }

    async fn upload_snapshot(&self, snapshot_path: &Path) -> Result<String, String> {
        let bucket = make_bucket()?;
        let existing = backup_keys(&bucket).await?;
        let (remaining, to_prune) = retention_split(existing, MAX_BACKUPS - 1);
        for oldest in to_prune {
            bucket
                .delete_object(&oldest)
                .await
                .map_err(|e| format!("Could not prune old backup {oldest}: {e}"))?;
        }
        let key = next_backup_key(&remaining);
        let mut snapshot = tokio::fs::File::open(snapshot_path)
            .await
            .map_err(|e| format!("Could not open SQLite snapshot: {e}"))?;
        bucket
            .put_object_stream(&mut snapshot, &key)
            .await
            .map_err(|e| format!("Could not upload backup to Backblaze B2: {e}"))?;
        Ok(key)
    }

    fn record_success(&self, summary: RecordSummary, revision: u64) {
        if let Ok(mut state) = self.state.lock() {
            state.backed_up_summary = Some(summary);
            state.status.last_backup_at = Some(now_ms().to_string());
            state.status.last_error = None;
            state.last_attempt_ms = None;
            if state.revision == revision {
                state.dirty_since_ms = None;
                state.status.pending_backup = false;
            } else {
                if state.dirty_since_ms.is_none() {
                    state.dirty_since_ms = Some(now_ms());
                }
                state.status.pending_backup = true;
            }
            persist_state(&self.state_path, &state);
        } else {
            log::error!("Backup succeeded, but its status could not be updated");
        }
    }

    fn record_failure(&self, error: &str) {
        if let Ok(mut state) = self.state.lock() {
            let now = now_ms();
            if state.dirty_since_ms.is_none() {
                state.dirty_since_ms = Some(now);
            }
            state.last_attempt_ms = Some(now);
            state.status.pending_backup = true;
            state.status.last_error = Some(error.to_string());
            state.status.configured = is_configured();
            persist_state(&self.state_path, &state);
        } else {
            log::error!("Backup failed and its status could not be updated: {error}");
        }
    }

    pub async fn prepare_restore(
        &self,
        db: &Mutex<Connection>,
    ) -> Result<Option<RestorePreview>, String> {
        let bucket = make_bucket()?;
        let mut keys = backup_keys(&bucket).await?;
        keys.sort();
        let Some(key) = keys.pop() else {
            return Ok(None);
        };

        let path = temporary_path(&self.temp_dir, "restore");
        let mut file = tokio::fs::File::create(&path)
            .await
            .map_err(|e| format!("Could not create temporary restore file: {e}"))?;
        if let Err(error) = bucket.get_object_to_writer(&key, &mut file).await {
            drop(file);
            remove_temp_file(&path);
            return Err(format!(
                "Could not download latest backup from Backblaze B2: {error}"
            ));
        }
        if let Err(error) = file.sync_all().await {
            drop(file);
            remove_temp_file(&path);
            return Err(format!("Could not flush downloaded backup: {error}"));
        }
        drop(file);

        let backup_connection =
            match Connection::open_with_flags(&path, OpenFlags::SQLITE_OPEN_READ_ONLY) {
                Ok(connection) => connection,
                Err(error) => {
                    remove_temp_file(&path);
                    return Err(format!(
                        "Downloaded backup is not a valid SQLite database: {error}"
                    ));
                }
            };
        let backup_summary = match summarize(&backup_connection) {
            Ok(summary) => summary,
            Err(error) => {
                remove_temp_file(&path);
                return Err(format!("Could not inspect downloaded backup: {error}"));
            }
        };
        let local = match db
            .lock()
            .map_err(|e| e.to_string())
            .and_then(|connection| summarize(&connection))
        {
            Ok(summary) => summary,
            Err(error) => {
                remove_temp_file(&path);
                return Err(error);
            }
        };

        let mut pending = match self.pending_restore.lock() {
            Ok(pending) => pending,
            Err(error) => {
                remove_temp_file(&path);
                return Err(error.to_string());
            }
        };
        if let Some((_, old_path)) = pending.replace((key.clone(), path.clone())) {
            remove_temp_file(&old_path);
        }

        Ok(Some(RestorePreview {
            backup_key: key,
            local,
            backup: backup_summary,
        }))
    }

    pub fn cancel_restore(&self) -> Result<(), String> {
        let pending = self
            .pending_restore
            .lock()
            .map_err(|e| e.to_string())?
            .take();
        if let Some((_, path)) = pending {
            fs::remove_file(path)
                .map_err(|e| format!("Could not remove temporary restore file: {e}"))?;
        }
        Ok(())
    }

    pub fn restore_backup(
        &self,
        key: &str,
        db: &Mutex<Connection>,
    ) -> Result<RecordSummary, String> {
        let (pending_key, path) = self
            .pending_restore
            .lock()
            .map_err(|e| e.to_string())?
            .as_ref()
            .cloned()
            .ok_or_else(|| "No restore preview is active".to_string())?;
        if pending_key != key {
            return Err("The restore preview no longer matches the selected backup".to_string());
        }

        let summary = (|| {
            let source = Connection::open_with_flags(&path, OpenFlags::SQLITE_OPEN_READ_ONLY)
                .map_err(|e| format!("Could not open downloaded backup: {e}"))?;
            let summary = summarize(&source)?;
            let mut destination = db.lock().map_err(|e| e.to_string())?;
            let backup = Backup::new(&source, &mut destination)
                .map_err(|e| format!("Could not prepare database restore: {e}"))?;
            backup
                .run_to_completion(5, Duration::from_millis(250), None)
                .map_err(|e| format!("Could not restore database: {e}"))?;
            Ok::<RecordSummary, String>(summary)
        })()?;

        self.pending_restore
            .lock()
            .map_err(|e| e.to_string())?
            .take();
        remove_temp_file(&path);

        if let Ok(mut state) = self.state.lock() {
            state.revision = state.revision.wrapping_add(1);
            state.backed_up_summary = Some(summary.clone());
            state.dirty_since_ms = None;
            state.last_attempt_ms = None;
            state.status.pending_backup = false;
            state.status.last_error = None;
            persist_state(&self.state_path, &state);
        } else {
            log::error!("Database restored, but backup status could not be updated");
        }
        Ok(summary)
    }
}

fn summarize(connection: &Connection) -> Result<RecordSummary, String> {
    let count: i64 = connection
        .query_row("SELECT COUNT(*) FROM Records", [], |row| row.get(0))
        .map_err(|e| format!("Could not count records: {e}"))?;
    let latest_record = connection
        .query_row(
            "SELECT id, name, createdAt, updatedAt FROM Records ORDER BY createdAt DESC, id DESC LIMIT 1",
            [],
            |row| {
                Ok(RecentRecord {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row.get(2)?,
                    updated_at: row.get(3)?,
                })
            },
        )
        .optional()
        .map_err(|e| format!("Could not read most recent record: {e}"))?;
    Ok(RecordSummary {
        count: count as u64,
        latest_record,
    })
}

fn make_bucket() -> Result<Box<Bucket>, String> {
    let key_id = env::var("S3_KEY_ID").map_err(|_| "S3_KEY_ID is not configured".to_string())?;
    let app_key = env::var("S3_APP_KEY").map_err(|_| "S3_APP_KEY is not configured".to_string())?;
    let endpoint =
        env::var("S3_ENDPOINT").map_err(|_| "S3_ENDPOINT is not configured".to_string())?;
    let endpoint = endpoint.trim_end_matches('/');
    let endpoint = if endpoint.starts_with("https://") || endpoint.starts_with("http://") {
        endpoint.to_string()
    } else {
        format!("https://{endpoint}")
    };
    let host = endpoint
        .split("://")
        .nth(1)
        .unwrap_or_default()
        .split('/')
        .next()
        .unwrap_or_default();
    let region = host
        .split('.')
        .nth(1)
        .filter(|value| value.starts_with("us-"))
        .unwrap_or("us-east-1")
        .to_string();

    let credentials = Credentials::new(Some(&key_id), Some(&app_key), None, None, None)
        .map_err(|e| format!("Could not initialize B2 credentials: {e}"))?;
    let region = Region::Custom { region, endpoint };
    let bucket = Bucket::new(BUCKET_NAME, region, credentials)
        .map_err(|e| format!("Could not initialize Backblaze B2 bucket: {e}"))?;
    Ok(bucket.with_path_style())
}

async fn backup_keys(bucket: &Bucket) -> Result<Vec<String>, String> {
    let pages = bucket
        .list(BACKUP_PREFIX.to_string(), None)
        .await
        .map_err(|e| format!("Could not list Backblaze B2 backups: {e}"))?;
    Ok(pages
        .into_iter()
        .flat_map(|page| page.contents)
        .map(|object| object.key)
        .filter(|key| key.starts_with(BACKUP_PREFIX) && key.ends_with(BACKUP_SUFFIX))
        .collect())
}

fn next_backup_key(existing: &[String]) -> String {
    let timestamp = now_ms();
    let mut index = 0_u32;
    loop {
        let key = format!("{BACKUP_PREFIX}{timestamp:013}-{index:03}{BACKUP_SUFFIX}");
        if !existing.contains(&key) {
            return key;
        }
        index += 1;
    }
}

fn retention_split(mut keys: Vec<String>, limit: usize) -> (Vec<String>, Vec<String>) {
    keys.sort();
    let excess = keys.len().saturating_sub(limit);
    let to_prune = keys.drain(..excess).collect();
    (keys, to_prune)
}

fn is_configured() -> bool {
    ["S3_KEY_ID", "S3_APP_KEY", "S3_ENDPOINT"]
        .iter()
        .all(|key| env::var(key).is_ok_and(|value| !value.trim().is_empty()))
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn temporary_path(directory: &Path, prefix: &str) -> PathBuf {
    loop {
        let sequence = TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let path = directory.join(format!("{prefix}-{}-{sequence}.db", now_ms()));
        if !path.exists() {
            return path;
        }
    }
}

fn remove_temp_file(path: &Path) {
    if let Err(error) = fs::remove_file(path) {
        if error.kind() != std::io::ErrorKind::NotFound {
            log::warn!("Could not remove temporary backup file: {error}");
        }
    }
}

fn persist_state(path: &Path, state: &PersistedState) {
    match serde_json::to_vec(state) {
        Ok(contents) => {
            if let Err(error) = fs::write(path, contents) {
                log::error!("Could not persist backup status: {error}");
            }
        }
        Err(error) => log::error!("Could not serialize backup status: {error}"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retention_keeps_the_ten_newest_backups() {
        let keys = (0..12)
            .map(|index| format!("appdata-{index:013}.backup.db"))
            .collect();

        let (retained, pruned) = retention_split(keys, MAX_BACKUPS);

        assert_eq!(retained.len(), 10);
        assert_eq!(pruned.len(), 2);
        assert_eq!(pruned[0], "appdata-0000000000000.backup.db");
        assert_eq!(retained[0], "appdata-0000000000002.backup.db");
    }

    #[test]
    fn retention_makes_room_before_uploading_a_new_snapshot() {
        let keys = (0..10)
            .map(|index| format!("appdata-{index:013}.backup.db"))
            .collect();

        let (retained, pruned) = retention_split(keys, MAX_BACKUPS - 1);

        assert_eq!(retained.len(), 9);
        assert_eq!(pruned.len(), 1);
        assert_eq!(pruned[0], "appdata-0000000000000.backup.db");
    }

    #[test]
    fn summary_counts_records_and_selects_the_latest_entry() {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch(
                "CREATE TABLE Records (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    createdAt TEXT,
                    updatedAt TEXT
                );
                INSERT INTO Records (id, name, createdAt, updatedAt) VALUES
                    (1, 'Earlier', '2025-01-01', '2025-01-01'),
                    (2, 'Latest', '2025-01-02', '2025-01-03');",
            )
            .unwrap();

        let summary = summarize(&connection).unwrap();

        assert_eq!(summary.count, 2);
        assert_eq!(
            summary.latest_record,
            Some(RecentRecord {
                id: 2,
                name: "Latest".to_string(),
                created_at: Some("2025-01-02".to_string()),
                updated_at: Some("2025-01-03".to_string()),
            })
        );
    }
}

#[tauri::command]
pub async fn get_backup_status(
    state: tauri::State<'_, crate::AppState>,
) -> Result<BackupStatus, String> {
    state.backup.status()
}

#[tauri::command]
pub async fn create_backup(state: tauri::State<'_, crate::AppState>) -> Result<String, String> {
    let backup = state.backup.clone();
    let db = state.db.clone();
    backup.create_backup(&db, true).await
}

#[tauri::command]
pub async fn prepare_restore(
    state: tauri::State<'_, crate::AppState>,
) -> Result<Option<RestorePreview>, String> {
    let backup = state.backup.clone();
    let db = state.db.clone();
    backup.prepare_restore(&db).await
}

#[tauri::command]
pub async fn cancel_restore(state: tauri::State<'_, crate::AppState>) -> Result<(), String> {
    state.backup.cancel_restore()
}

#[tauri::command]
pub async fn restore_backup(
    backup_key: String,
    state: tauri::State<'_, crate::AppState>,
) -> Result<RecordSummary, String> {
    let backup = state.backup.clone();
    let db = state.db.clone();
    backup.restore_backup(&backup_key, &db)
}

#[tauri::command]
pub async fn retry_backup(state: tauri::State<'_, crate::AppState>) -> Result<(), String> {
    state.backup.retry_now()
}
