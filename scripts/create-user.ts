/**
 * Script para crear el primer usuario en la tabla `users`.
 * Uso: npx tsx scripts/create-user.ts
 */
import bcrypt from "bcryptjs";
import postgres from "postgres";

const email = "admin@example.com"; // ← cambiá esto
const password = "tu-password";     // ← cambiá esto
const name = "Admin";               // ← cambiá esto

async function main() {
  const db = postgres(process.env.DATABASE_URL!);
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name}, ${passwordHash})
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    RETURNING id, email, name
  `;

  console.log("Usuario creado/actualizado:", user);
  await db.end();
}

main().catch(console.error);
