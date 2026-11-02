import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const key = req.headers.get("x-admin-key") || "";
    const expected = process.env.ADMIN_KEY || "";
    if (expected && key !== expected) return new Response("Unauthorized", { status: 401 });

    const store = getStore({ name: "visits", region: "us-east-2" });
    const { blobs } = await store.list();
    for (const b of blobs) await store.delete(b.key);

    return new Response(JSON.stringify({ ok: true, deleted: blobs.length }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
};

export const config = { path: "/.netlify/functions/clear" };
