import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const store = getStore("visits");

    const geo = context.geo || {};
    const ip =
      context.ip ||
      req.headers.get("x-nf-client-connection-ip") ||
      "unknown";

    const record = {
      time: new Date().toISOString(),
      ip,
      country: (geo.country && geo.country.name) || "",
      region: (geo.subdivision && geo.subdivision.name) || "",
      city: geo.city || "",
      device: req.headers.get("user-agent") || "",
      referer: req.headers.get("referer") || ""
    };

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await store.setJSON(id, record);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

export const config = { path: "/.netlify/functions/log" };
