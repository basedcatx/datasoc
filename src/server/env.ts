import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const envConfig = createEnv({
	server: {
		AUTH_SECRET: z.string(),
		AUTH_RESEND_KEY: z.string(),
	},

	client: {},

	runtimeEnv: {
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
	},
});
