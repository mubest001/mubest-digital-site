import { handleUpload } from "@vercel/blob/client";
import { ensureSchema } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    await ensureSchema();
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        const admin = await requireAdmin(req);
        if (!admin) throw new Error("You must be signed in to upload files.");
        return {
          allowedContentTypes: [
            "image/jpeg","image/png","image/webp","image/gif","image/svg+xml",
            "video/mp4","video/webm"
          ],
          maximumSizeInBytes: 50 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: admin.user_id })
        };
      },
      onUploadCompleted: async () => {
        // The authenticated browser records the completed asset in the media library.
      }
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Upload API:", error);
    return res.status(400).json({ error: error.message || "Upload could not be authorized." });
  }
}
