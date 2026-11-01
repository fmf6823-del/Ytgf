import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const key = req.headers.get("x-admin-key") || "";
    const expected = process.env.ADMIN_KEY || "";
    if (expected && key !== expected) return new Response("Unauthorized", { status: 401 });

    const { data, mime } = await req.json();
    if (!data) return new Response(JSON.stringify({ ok: false, error: "No data" }), { status: 400 });

    const id = Math.random().toString(36).slice(2, 10);
    const store = getStore("images");
    await store.setJSON(id, { data, mime: mime || "image/png" });

    const origin = new URL(req.url).origin;
    return new Response(JSON.stringify({
      ok: true, id, url: `${origin}/img/${id}`
    }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
};

export const config = { path: "/.netlify/functions/upload-image" };
