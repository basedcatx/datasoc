import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { envConfig } from "../env";
import * as schema from "./schema";

const client = createClient({
	url: envConfig.TURSO_DB,
	authToken: envConfig.TURSO_AUTH,
});

export const db = drizzle(client, { schema, logger: true });
