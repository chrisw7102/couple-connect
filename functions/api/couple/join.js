// functions/api/couple/join.js
import { getUserFromRequest, json } from "../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  const user = await getUserFromRequest(request, db);
  if (!user) return json({ error: "Not authenticated" }, { status: 401 });
  if (user.couple_id) return json({ error: "You're already linked to a partner" }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const code = String(body.invite_code || "").trim().toUpperCase();
  if (!code) return json({ error: "Invite code is required" }, { status: 400 });

  const couple = await db
    .prepare("SELECT * FROM couples WHERE invite_code = ?")
    .bind(code)
    .first();
  if (!couple) return json({ error: "Invalid invite code" }, { status: 404 });

  const membersCount = await db
    .prepare("SELECT COUNT(*) as count FROM users WHERE couple_id = ?")
    .bind(couple.id)
    .first();
  if (membersCount.count >= 2) {
    return json({ error: "This couple already has two members" }, { status: 400 });
  }

  await db.prepare("UPDATE users SET couple_id = ? WHERE id = ?").bind(couple.id, user.id).run();

  return json({ couple_id: couple.id });
}
