import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const images = getStore("images");
  const img = await images.get(id, { type: "json" });
  if (!img) return new Response("Image not found", { status: 404 });

  try {
    const visits = getStore("visits");
    const geo = context.geo || {};
    const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
    await visits.setJSON(
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      {
        time: new Date().toISOString(),
        ip,
        country: (geo.country && geo.country.name) || "",
        region: (geo.subdivision && geo.subdivision.name) || "",
        city: geo.city || "",
        device: req.headers.get("user-agent") || "",
        referer: req.headers.get("referer") || "",
        linkId: id,
        target: "[image view]"
      }
    );
  } catch {}

  const buf = Buffer.from(img.data, "base64");
  return new Response(buf, {
    status: 200,
    headers: { "content-type": img.mime || "image/png", "cache-control": "no-store" }
  });
};

export const config = { path: "/.netlify/functions/image" };
