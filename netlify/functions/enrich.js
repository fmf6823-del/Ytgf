export default async (req, context) => {
  const url = new URL(req.url);
  const ip = url.searchParams.get("ip");
  if (!ip) return new Response(JSON.stringify({ ok: false, error: "no ip" }), { status: 400 });

  try {
    const token = process.env.IPINFO_TOKEN || "";
    const api = `https://ipinfo.io/${encodeURIComponent(ip)}/json${token ? "?token=" + token : ""}`;
    const r = await fetch(api);
    if (!r.ok) throw new Error("ipinfo HTTP " + r.status);
    const data = await r.json();
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
};

export const config = { path: "/.netlify/functions/enrich" };
