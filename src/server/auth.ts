import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { envConfig } from "./env";
import { users } from "./db/schema";
import { DrizzleQueryError, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
	secret: envConfig.AUTH_SECRET,
	trustHost: true,
	useSecureCookies: false,
	providers: [
		Credentials({
			credentials: {
				email: {},
				password: {},
			},
			async authorize(credentials) {
				try {
					if (!credentials.email || !credentials.password) return null;

					const [existingUser] = await db
						.select()
						.from(users)
						.where(eq(users.email, credentials.email as string))
						.limit(1);

					if (!existingUser) {
						const hashedPassword = await bcrypt.hash(
							credentials.password as string,
							10,
						);

						const newUserId = crypto.randomUUID();

						await db.insert(users).values({
							id: newUserId,
							email: credentials.email as string,
							password: hashedPassword,
							name: (credentials.email as string).split("@")[0], // Fallback name from email
							role: "user",
						});

						return {
							id: newUserId,
							name: (credentials.email as string).split("@")[0],
							email: credentials.email,
							role: "user",
						};
					}

					const isValid = await bcrypt.compare(
						credentials.password as string,
						existingUser.password as string,
					);

					if (!isValid) throw new Error("invalid-password");

					return {
						id: existingUser.id,
						name: existingUser.name,
						email: existingUser.email,
						role: existingUser.role,
					};
				} catch (e) {
					if (e instanceof DrizzleQueryError) {
						console.log(e.cause?.message);
						if (e.cause?.message.includes("getaddrinfo")) {
							throw new Error("no-internet");
						}
					}
					throw e;
				}
			},
		}),
	],
	adapter: DrizzleAdapter(db),
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.role = user?.role as string;
				token.id = user.id as string;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user && token) {
				session.user.role = token.role as string;
				session.user.id = token.id as string;
			}
			return session;
		},
	},
	session: { strategy: "jwt" },
	pages: {
		signIn: "/",
		newUser: "/",
	},
});
