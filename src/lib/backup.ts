import { s3client } from "#/server/db";

export class BackupManager {
	public async backupDB() {
		const allFiles = await s3client.list();
		console.log(allFiles);
		// list all files in the bucket that end with .sql
		// If the files are more than 10 delete the oldest files till they are max 10 ie sort files by date desc and delete the first 10 - file-length files
		//
		//
	}
}
