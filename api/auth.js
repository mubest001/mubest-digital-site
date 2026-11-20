import { ensureSchema, query, audit } from "../lib/db.js";
import { hashPassword, verifyPassword, safeEqual, createSession, getSession, deleteSession, clearSessionCookie, assertSameOrigin } from "../lib/auth.js";

function send(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(data);
}

export default async function handler(req, res) {
  try {
    await ensureSchema();

    if (req.method === "GET") {
      const [count] = await query("SELECT COUNT(*)::int AS total FROM admin_users");
      const session = await getSession(req);
      return send(res, 200, {
        configured: Number(count.total) > 0,
        authenticated: Boolean(session),
        email: session?.email || ""
      });
    }

    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    assertSameOrigin(req);

    const body = req.body || {};
    const action = body.action;

    if (action === "setup") {
      const [count] = await query("SELECT COUNT(*)::int AS total FROM admin_users");
      if (Number(count.total) > 0) return send(res, 409, { error: "An administrator account already exists." });
      if (!process.env.ADMIN_SETUP_KEY) return send(res, 503, { error: "ADMIN_SETUP_KEY has not been configured in Vercel." });
      if (!safeEqual(body.setup_key, process.env.ADMIN_SETUP_KEY)) return send(res, 401, { error: "The setup key is incorrect." });

      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: "Enter a valid email address." });
      if (password.length < 12) return send(res, 400, { error: "Use a password with at least 12 characters." });

      const [user] = await query(
        "INSERT INTO admin_users (email,password_hash) VALUES ($1,$2) RETURNING id,email",
        [email, await hashPassword(password)]
      );
      await createSession(user.id, req, res);
      await audit(user.id, "created", "admin", user.id, "Created the first administrator account.");
      return send(res, 201, { ok: true, email: user.email });
    }

    if (action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const [user] = await query("SELECT id,email,password_hash FROM admin_users WHERE email=$1 LIMIT 1", [email]);
      if (!user || !(await verifyPassword(String(body.password || ""), user.password_hash))) {
        return send(res, 401, { error: "Email or password is incorrect." });
      }
      await createSession(user.id, req, res);
      await audit(user.id, "login", "admin", user.id, "Administrator signed in.");
      return send(res, 200, { ok: true, email: user.email });
    }

    if (action === "logout") {
      const session = await getSession(req);
      if (session) await audit(session.user_id, "logout", "admin", session.user_id, "Administrator signed out.");
      await deleteSession(req);
      clearSessionCookie(res, req);
      return send(res, 200, { ok: true });
    }

    if (action === "change-password") {
      const session = await getSession(req);
      if (!session) return send(res, 401, { error: "Please sign in again." });
      const [user] = await query("SELECT password_hash FROM admin_users WHERE id=$1", [session.user_id]);
      if (!(await verifyPassword(String(body.current_password || ""), user.password_hash))) {
        return send(res, 401, { error: "Your current password is incorrect." });
      }
      const next = String(body.new_password || "");
      if (next.length < 12) return send(res, 400, { error: "Your new password must contain at least 12 characters." });
      await query("UPDATE admin_users SET password_hash=$1,updated_at=NOW() WHERE id=$2", [await hashPassword(next), session.user_id]);
      await query("DELETE FROM admin_sessions WHERE user_id=$1", [session.user_id]);
      await createSession(session.user_id, req, res);
      await audit(session.user_id, "changed password", "admin", session.user_id, "Administrator changed the account password.");
      return send(res, 200, { ok: true });
    }

    return send(res, 400, { error: "Unknown authentication action." });
  } catch (error) {
    console.error("Auth API:", error);
    return send(res, error.statusCode || 500, { error: error.message || "Authentication failed." });
  }
}
