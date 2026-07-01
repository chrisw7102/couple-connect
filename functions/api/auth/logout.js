// functions/api/auth/logout.js
import { getCookie, clearCookieHeader, json } from "../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  const token = getCookie(request, "session");
  if (token) {
    await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  return json({ ok: true }, { headers: { "Set-Cookie": clearCookieHeader() } });
}
