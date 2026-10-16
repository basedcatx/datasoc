import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const envConfig = createEnv({
	server: {
		AUTH_SECRET: z.string(),
		S3_KEY_ID: z.string(),
		S3_APP_KEY: z.string(),
		S3_ENDPOINT: z.string(),
		TURSO_DB: z.string(),
		TURSO_AUTH: z.string(),
	},

	client: {},

	runtimeEnv: {
		AUTH_SECRET: process.env.AUTH_SECRET,
		S3_APP_KEY: process.env.S3_APP_KEY,
		S3_ENDPOINT: process.env.S3_ENDPOINT,
		S3_KEY_ID: process.env.S3_KEY_ID,
		TURSO_AUTH: process.env.TURSO_AUTH_TOKEN,
		TURSO_DB: process.env.TURSO_DATABASE_URL,
	},
});
