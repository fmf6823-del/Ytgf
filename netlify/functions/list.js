import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const suppliedKey =
      req.headers.get("x-admin-key") || url.searchParams.get("key") || "";

    const expectedKey = process.env.ADMIN_KEY || "";
    if (expectedKey && suppliedKey !== expectedKey) {
      return new Response("Unauthorized", { status: 401 });
    }

    const store = getStore("visits");
    const { blobs } = await store.list();

    const records = [];
    for (const b of blobs) {
      const rec = await store.get(b.key, { type: "json" });
      if (rec) records.push(rec);
    }
    records.sort((a, b) => new Date(b.time) - new Date(a.time));

    return new Response(JSON.stringify(records), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config = { path: "/.netlify/functions/list" };
