// functions/api/auth/me.js
import { getUserFromRequest, json } from "../../lib/auth.js";

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  const user = await getUserFromRequest(request, db);
  if (!user) {
    return json({ user: null }, { status: 401 });
  }

  let partner = null;
  let invite_code = null;

  if (user.couple_id) {
    const couple = await db
      .prepare("SELECT invite_code FROM couples WHERE id = ?")
      .bind(user.couple_id)
      .first();
    invite_code = couple ? couple.invite_code : null;

    partner = await db
      .prepare("SELECT id, name, email FROM users WHERE couple_id = ? AND id != ?")
      .bind(user.couple_id, user.id)
      .first();
  }

  return json({ user, partner: partner || null, invite_code });
}
