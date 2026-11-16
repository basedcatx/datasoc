import { invoke } from "@tauri-apps/api/core";

export interface RecentRecord {
	id: number;
	name: string;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface RecordSummary {
	count: number;
	latestRecord: RecentRecord | null;
}

export interface BackupStatus {
	configured: boolean;
	lastBackupAt: string | null;
	lastError: string | null;
	pendingBackup: boolean;
}

export interface RestorePreview {
	backupKey: string;
	local: RecordSummary;
	backup: RecordSummary;
}

export const getBackupStatus = () => invoke<BackupStatus>("get_backup_status");

export const createBackup = () => invoke<string>("create_backup");

export const prepareRestore = () =>
	invoke<RestorePreview | null>("prepare_restore");

export const cancelRestore = () => invoke<void>("cancel_restore");

export const restoreBackup = (backupKey: string) =>
	invoke<RecordSummary>("restore_backup", { backupKey });
