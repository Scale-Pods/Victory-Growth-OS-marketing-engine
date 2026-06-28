// Supabase Edge Function: brand-overlay
// Composites the Victory Energy branding (logo + footer bar with tagline,
// website and social handle) onto a generated content image.
//
// Input:  POST { itemId: string }
// Effect: reads content_items.media_url (raw AI image), stamps branding via
//         ImageScript, uploads to content-media/items/{id}-branded.png and
//         updates the row's media_url to the branded version.
// Output: { brandedUrl } | { error }
//
// Deployed to Supabase project jjtdbbdzidycgdzjkvvf as `brand-overlay`
// (verify_jwt disabled — internal branding endpoint, called from the n8n
// "VE Content Factory - Branding Overlay" workflow).

import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/content-media/brand/ve-logo.png`;
const FONT_BOLD = "https://cdn.jsdelivr.net/npm/@expo-google-fonts/roboto@0.2.3/Roboto_700Bold.ttf";
const FONT_REG = "https://cdn.jsdelivr.net/npm/@expo-google-fonts/roboto@0.2.3/Roboto_400Regular.ttf";

function sbHeaders() { return { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` }; }
function json(o: unknown, status = 200) { return new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } }); }
async function bytes(url: string): Promise<Uint8Array> { const r = await fetch(url); if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`); return new Uint8Array(await r.arrayBuffer()); }
function parseSocials(s: string): string { const ig = (s.match(/instagram\.com\/([^\/\s]+)/i) || [])[1]; return ig ? "@" + ig.replace(/\/$/, "") : ""; }

Deno.serve(async (req) => {
  try {
    const { itemId } = await req.json();
    if (!itemId) return json({ error: "itemId required" }, 400);

    const itemRes = await fetch(`${SUPABASE_URL}/rest/v1/content_items?id=eq.${itemId}&select=id,media_url,profile_id`, { headers: sbHeaders() });
    const [item] = await itemRes.json();
    if (!item || !item.media_url) return json({ error: "item or media_url missing" }, 404);

    const profRes = await fetch(`${SUPABASE_URL}/rest/v1/business_profiles?id=eq.${item.profile_id}&select=tagline,website_url,social_media_urls`, { headers: sbHeaders() });
    const [prof] = await profRes.json();

    const [bgB, logoB, boldF, regF] = await Promise.all([bytes(item.media_url), bytes(LOGO_URL), bytes(FONT_BOLD), bytes(FONT_REG)]);
    const bg = await Image.decode(bgB); bg.resize(1024, 1024);
    const logo = await Image.decode(logoB); logo.resize(Image.RESIZE_AUTO, 70);

    const barH = 160; const barY = 1024 - barH;
    const bar = new Image(1024, barH).fill(0xfffffff5);
    bg.composite(bar, 0, barY);
    const accent = new Image(1024, 6).fill(0x4374b9ff);
    bg.composite(accent, 0, barY);
    bg.composite(logo, 50, barY + Math.round((barH - logo.height) / 2));

    const tagline = (prof?.tagline || "").trim();
    const website = (prof?.website_url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
    const ig = parseSocials(prof?.social_media_urls || "");
    const tx = 50 + logo.width + 50;
    if (tagline) { const t = await Image.renderText(boldF, 26, tagline, 0x2f5fb0ff); bg.composite(t, tx, barY + 46); }
    const line2 = [website, ig].filter(Boolean).join("     ·     ");
    if (line2) { const t2 = await Image.renderText(regF, 22, line2, 0x555555ff); bg.composite(t2, tx, barY + 96); }

    const out = await bg.encode(1);
    const path = `items/${itemId}-branded.png`;
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/content-media/${path}`, { method: "POST", headers: { ...sbHeaders(), "Content-Type": "image/png", "x-upsert": "true" }, body: out });
    if (!up.ok) return json({ error: `upload failed ${up.status}: ${await up.text()}` }, 500);

    const brandedUrl = `${SUPABASE_URL}/storage/v1/object/public/content-media/${path}`;
    await fetch(`${SUPABASE_URL}/rest/v1/content_items?id=eq.${itemId}`, { method: "PATCH", headers: { ...sbHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ media_url: brandedUrl }) });

    return json({ brandedUrl });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
