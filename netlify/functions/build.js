import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const key = req.headers.get("x-admin-key") || "";
    const expected = process.env.ADMIN_KEY || "";
    if (expected && key !== expected) return new Response("Unauthorized", { status: 401 });

    const { target } = await req.json();
    if (!target || !/^https?:\/\//i.test(target)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid URL" }), {
        status: 400, headers: { "content-type": "application/json" }
      });
    }

    const store = getStore("links");
    const id = Math.random().toString(36).slice(2, 6);
    await store.setJSON(id, { target, created: new Date().toISOString() });

    const origin = new URL(req.url).origin;
    return new Response(JSON.stringify({
      ok: true,
      id,
      short: `${origin}/r/${id}`,
      preview: `${origin}/r/${id}`
    }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
};

export const config = { path: "/.netlify/functions/build" };
