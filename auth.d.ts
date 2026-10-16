import { DefaultSession } from "next-auth";
import { DefaultAdapter } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: string;
  }
}
