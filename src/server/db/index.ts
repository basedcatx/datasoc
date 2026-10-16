import { createClient } from "@libsql/client";
import { S3Client } from "bun";
import { drizzle } from "drizzle-orm/libsql";
import { envConfig } from "../env";
import * as schema from "./schema";

const client = createClient({
	url: envConfig.TURSO_DB,
	authToken: envConfig.TURSO_AUTH,
});

export const s3client = new S3Client({
	accessKeyId: envConfig.S3_KEY_ID,
	secretAccessKey: envConfig.S3_APP_KEY,
	endpoint: envConfig.S3_ENDPOINT,
	region: "auto",
	bucket: "hans-record-backup",
});

export const db = drizzle(client, { schema, logger: true });
