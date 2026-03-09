import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof postgres> | undefined;
}

// Reuse single connection across hot-reloads in development
const db =
  globalThis._db ??
  postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") globalThis._db = db;

export { db };
