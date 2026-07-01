// functions/api/auth/register.js
import { newId, hashPassword, createSession, sessionCookieHeader, json } from "../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, password } = body;

  if (!name || !email || !password) {
    return json({ error: "Name, email, and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(normalizedEmail)
    .first();
  if (existing) {
    return json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const { hash, salt } = await hashPassword(password);
  const userId = newId();

  await db
    .prepare(
      "INSERT INTO users (id, email, name, password_hash, salt, couple_id, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)"
    )
    .bind(userId, normalizedEmail, name.trim(), hash, salt, Date.now())
    .run();

  const token = await createSession(db, userId);

  return json(
    { user: { id: userId, name: name.trim(), email: normalizedEmail, couple_id: null } },
    { status: 201, headers: { "Set-Cookie": sessionCookieHeader(token, 60 * 60 * 24 * 30) } }
  );
}
