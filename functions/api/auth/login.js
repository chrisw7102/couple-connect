// functions/api/auth/login.js
import { verifyPassword, createSession, sessionCookieHeader, json } from "../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return json({ error: "Email and password are required" }, { status: 400 });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await db
    .prepare("SELECT * FROM users WHERE email = ?")
    .bind(normalizedEmail)
    .first();

  if (!user) {
    return json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.salt, user.password_hash);
  if (!valid) {
    return json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSession(db, user.id);

  return json(
    { user: { id: user.id, name: user.name, email: user.email, couple_id: user.couple_id } },
    { headers: { "Set-Cookie": sessionCookieHeader(token, 60 * 60 * 24 * 30) } }
  );
}
