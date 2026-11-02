import { getStore } from "@netlify/blobs";

const errPage = (msg, code) => new Response(
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Link</title>
   <style>body{font-family:Arial;max-width:480px;margin:80px auto;text-align:center;color:#eee;background:#111}
   a{color:#5ab8ff}</style></head><body>
   <h2>🔗 ${msg}</h2><p><a href="/">Go home</a></p></body></html>`,
  { status: code, headers: { "content-type": "text/html; charset=utf-8" } }
);

export default async (req, context) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return errPage("No link specified", 400);

  const links = getStore({ name: "links", region: "us-east-2" });
  const link = await links.get(id, { type: "json" });
  if (!link) return errPage("Link not found or expired", 404);

  try {
    const visits = getStore({ name: "visits", region: "us-east-2" });
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
        target: link.target
      }
    );
  } catch (e) {
    console.error("log failed:", e);
  }

  const safeTarget = link.target.replace(/"/g, "&quot;");
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecting…</title>
<style>
  body{font-family:Arial,sans-serif;max-width:480px;margin:80px auto;padding:0 20px;text-align:center;color:#222;background:#fff}
  @media(prefers-color-scheme:dark){body{color:#eee;background:#111}}
  .notice{border:1px solid #888;border-radius:8px;padding:18px;margin:20px 0}
  a.btn{display:inline-block;padding:10px 18px;background:#1a7f37;color:#fff;text-decoration:none;border-radius:6px;margin-top:10px}
</style></head><body>
  <div class="notice">
    <h2>⚠️ This link is tracked</h2>
    <p>This is a short link created by a visitor. Basic info is recorded for analytics.</p>
    <p>Redirecting in 3 seconds…</p>
    <a class="btn" href="${safeTarget}" rel="noopener">Continue now →</a>
  </div>
  <script>setTimeout(function(){location.href=${JSON.stringify(link.target)};},3000);</script>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
};

export const config = { path: "/.netlify/functions/redirect" };
