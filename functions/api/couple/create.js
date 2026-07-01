// functions/api/couple/create.js
import { getUserFromRequest, newId, newInviteCode, json } from "../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  const user = await getUserFromRequest(request, db);
  if (!user) return json({ error: "Not authenticated" }, { status: 401 });
  if (user.couple_id) return json({ error: "You're already linked to a partner" }, { status: 400 });

  const coupleId = newId();
  let inviteCode = newInviteCode();

  // Extremely unlikely collision, but guard anyway
  for (let i = 0; i < 5; i++) {
    const existing = await db
      .prepare("SELECT id FROM couples WHERE invite_code = ?")
      .bind(inviteCode)
      .first();
    if (!existing) break;
    inviteCode = newInviteCode();
  }

  await db
    .prepare("INSERT INTO couples (id, invite_code, created_at) VALUES (?, ?, ?)")
    .bind(coupleId, inviteCode, Date.now())
    .run();

  await db.prepare("UPDATE users SET couple_id = ? WHERE id = ?").bind(coupleId, user.id).run();

  return json({ couple_id: coupleId, invite_code: inviteCode });
}
