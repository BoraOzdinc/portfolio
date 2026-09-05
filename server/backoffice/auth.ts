import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { getMigrations } from "better-auth/db/migration";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import type { Store } from "./database";

export function isAllowedAccount(
  account: { providerId: string; accountId: string } | undefined,
  allowed: string | undefined,
) {
  return (
    !!allowed &&
    account?.providerId === "github" &&
    account.accountId === allowed
  );
}
export async function configureAuth(store: Store) {
  const {
    BETTER_AUTH_SECRET,
    BETTER_AUTH_URL,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    ADMIN_GITHUB_ID,
  } = process.env;
  if (
    !BETTER_AUTH_SECRET ||
    !BETTER_AUTH_URL ||
    !GITHUB_CLIENT_ID ||
    !GITHUB_CLIENT_SECRET ||
    !ADMIN_GITHUB_ID
  )
    return null;
  if (BETTER_AUTH_SECRET.length < 32 || !/^\d+$/.test(ADMIN_GITHUB_ID))
    throw new Error("Auth secret veya GitHub ID geçersiz.");
  const auth = betterAuth({
    database: store.sqlite,
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
    trustedOrigins: [new URL(BETTER_AUTH_URL).origin],
    socialProviders: {
      github: {
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        mapProfileToUser: (profile) => {
          if (String(profile.id) !== ADMIN_GITHUB_ID)
            throw new APIError("FORBIDDEN", {
              message: "Bu hesap yetkili değil.",
            });
          return {};
        },
      },
    },
    account: { accountLinking: { enabled: false } },
    advanced: {
      useSecureCookies: new URL(BETTER_AUTH_URL).protocol === "https:",
    },
    rateLimit: { enabled: true },
  });
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  const identify = async (req: Request) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) return null;
    const account = store.sqlite
      .prepare(
        "SELECT providerId, accountId FROM account WHERE userId = ? AND providerId = ?",
      )
      .get(session.user.id, "github") as
      { providerId: string; accountId: string } | undefined;
    return {
      name: session.user.name,
      allowed: isAllowedAccount(account, ADMIN_GITHUB_ID),
    };
  };
  return { auth, identify };
}
