import { ensureSchema, query } from "../lib/db.js";

function clean(value, max = 4000) {
  return String(value || "").trim().slice(0, max);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    await ensureSchema();
    const body = req.body || {};
    if (clean(body.website, 300)) return res.status(200).json({ ok: true });
    const name = clean(body.name, 160);
    const email = clean(body.email, 254).toLowerCase();
    const service = clean(body.service, 180);
    const budget = clean(body.budget, 80);
    const message = clean(body.message, 5000);

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
      return res.status(400).json({ error: "Please complete your name, valid email address and project details." });
    }

    await query(
      "INSERT INTO leads (name,email,service,budget,message) VALUES ($1,$2,$3,$4,$5)",
      [name,email,service,budget,message]
    );
    return res.status(201).json({ ok: true, message: "Thank you. Your enquiry has been received. If approved, Mubest Digital will send a private client portal activation link to your email." });
  } catch (error) {
    console.error("Contact API:", error);
    return res.status(503).json({ error: "The enquiry form is temporarily unavailable. Please try again shortly." });
  }
}
