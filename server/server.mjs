// Serveur du site Lien du Cœur Pharma : fichiers statiques + formulaire de contact.
// Node.js seul, aucune dépendance npm.
//
// Formulaire (POST /api/contact, urlencoded, envoyé par js/main.js du thème) :
//   1. contrôles : pot de miel, consentement, champs requis, limite de débit par IP ;
//   2. PERSISTANCE D'ABORD : une ligne JSON ajoutée à $DATA_DIR/messages.jsonl (PVC) ;
//   3. notification ensuite, sans bloquer la réponse : courriel via l'API Resend.
// Un message enregistré n'est jamais perdu, même si l'envoi du courriel échoue
// (kladriva-context/REGLES.md §2). Réponse : chaîne JSON {alert, message} que le thème affiche.
import { createServer } from "node:http";
import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { brotliCompressSync, constants as zc, gzipSync } from "node:zlib";

const PORT = Number(process.env.PORT || 8080);
const ROOT = process.env.PUBLIC_DIR || new URL("../public", import.meta.url).pathname;
const DATA_DIR = process.env.DATA_DIR || "/data";
const GIT_SHA = process.env.GIT_SHA || "dev";
// Seul l'hôte canonique est indexable : IP, NodePort ou tout autre hôte → X-Robots-Tag: noindex.
const CANONICAL_HOST = process.env.CANONICAL_HOST || "lienducoeurpharma.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_TO = process.env.CONTACT_TO || "lienducoeurpharma@gmail.com";
const CONTACT_FROM = process.env.CONTACT_FROM || "Site Lien du Cœur Pharma <formulaire@kladriva.com>";
// Version du texte de consentement affiché sous le formulaire (Loi 25 : tracée avec chaque message).
const CONSENT_VERSION = "2026-10-30";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".eot": "application/vnd.ms-fontobject",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

// Le thème fait $.parseJSON(result) : il faut renvoyer une CHAÎNE JSON (text/plain),
// pas application/json (jQuery la parserait déjà et parseJSON échouerait).
function formReply(res, ok, message) {
  send(res, 200, JSON.stringify({ alert: ok ? "alert-success" : "alert-danger", message }),
    { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
}

// --- Limite de débit : 5 envois par IP et par 10 minutes (mémoire du pod). ---
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 10000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req) {
  // NPM → Traefik → pod : X-Real-IP est posé par NPM (proxy.conf).
  return (req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0]
    || req.socket.remoteAddress || "").trim();
}

function readBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const clip = (v, n) => String(v || "").trim().slice(0, n);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function notify(msg) {
  if (!RESEND_API_KEY) {
    console.warn(`contact ${msg.id} : RESEND_API_KEY absente, courriel non envoyé (message enregistré)`);
    return;
  }
  const rows = [["Nom et fonction", msg.name], ["E-mail", msg.email], ["Laboratoire / entreprise", msg.company],
    ["Pays", msg.country], ["Type de produits", msg.productType], ["Formulaire", msg.source]];
  const html = `<h2>Nouvelle demande depuis lienducoeurpharma.com</h2><table>${rows
    .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v || "—")}</td></tr>`).join("")}</table>`
    + `<p><b>Message</b></p><p>${esc(msg.message || "—").replace(/\n/g, "<br>")}</p>`
    + `<p style="color:#888;font-size:12px">Réf. ${msg.id} · ${msg.receivedAt}</p>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CONTACT_FROM, to: [CONTACT_TO], reply_to: msg.email,
        subject: `Demande ${msg.source === "partenariat" ? "de partenariat" : "de contact"} — ${msg.company || msg.name}`,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error(`contact ${msg.id} : Resend ${r.status} ${await r.text()}`);
    else console.log(`contact ${msg.id} : courriel envoyé`);
  } catch (e) {
    console.error(`contact ${msg.id} : envoi échoué (${e.name}) — message conservé dans messages.jsonl`);
  }
}

async function handleContact(req, res) {
  let form;
  try {
    form = new URLSearchParams(await readBody(req));
  } catch {
    return formReply(res, false, "Message trop long.");
  }
  // Pot de miel : un robot remplit le champ caché ; on répond « succès » sans rien faire.
  if (form.get("website")) return formReply(res, true, "Merci, votre demande a bien été envoyée.");
  if (rateLimited(clientIp(req))) {
    return formReply(res, false, "Trop d'envois en peu de temps. Réessayez dans quelques minutes.");
  }
  const msg = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    source: form.get("source") === "partenariat" ? "partenariat" : "accueil",
    name: clip(form.get("name"), 200),
    email: clip(form.get("email"), 200),
    company: clip(form.get("company"), 200),
    country: clip(form.get("country"), 100),
    productType: clip(form.get("select"), 100),
    message: clip(form.get("comment"), 5000),
    consent: form.get("consent") === "on",
    consentVersion: CONSENT_VERSION,
  };
  if (!msg.consent) return formReply(res, false, "Merci de cocher la case de consentement.");
  if (!msg.name || !msg.company || !EMAIL.test(msg.email)) {
    return formReply(res, false, "Merci de remplir les champs obligatoires avec une adresse e-mail valide.");
  }
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(join(DATA_DIR, "messages.jsonl"), JSON.stringify(msg) + "\n");
  } catch (e) {
    console.error(`contact : persistance impossible (${e.message})`);
    return formReply(res, false, "Envoi impossible pour le moment. Écrivez-nous à lienducoeurpharma@gmail.com.");
  }
  console.log(`contact ${msg.id} : enregistré (${msg.source})`);
  notify(msg); // volontairement non attendu : le courriel ne bloque jamais la réponse
  return formReply(res, true, "Merci, votre demande a bien été envoyée. Nous vous répondons rapidement.");
}

// Compression : les fichiers de l'image ne changent jamais, chaque variante (br/gzip) est
// calculée une fois puis gardée en mémoire. Types texte seulement (images/polices déjà compressées).
const COMPRESSIBLE = /^(text\/|application\/(json|xml)|image\/svg\+xml)/;
const compressed = new Map();

function pickEncoding(req, type, size) {
  if (!COMPRESSIBLE.test(type) || size < 1024) return null;
  const accept = String(req.headers["accept-encoding"] || "");
  if (/\bbr\b/.test(accept)) return "br";
  if (/\bgzip\b/.test(accept)) return "gzip";
  return null;
}

function encoded(file, raw, enc) {
  const key = `${enc}:${file}`;
  if (!compressed.has(key)) {
    compressed.set(key, enc === "br"
      ? brotliCompressSync(raw, { params: { [zc.BROTLI_PARAM_QUALITY]: 11, [zc.BROTLI_PARAM_SIZE_HINT]: raw.length } })
      : gzipSync(raw, { level: 9 }));
  }
  return compressed.get(key);
}

async function sendFile(req, res, file, type, cache) {
  const raw = await readFile(file);
  const enc = pickEncoding(req, type, raw.length);
  const body = enc ? encoded(file, raw, enc) : raw;
  const headers = { "Content-Type": type, "Cache-Control": cache, "Content-Length": body.length, Vary: "Accept-Encoding" };
  if (enc) headers["Content-Encoding"] = enc;
  return send(res, 200, req.method === "HEAD" ? "" : body, headers);
}

async function serveStatic(req, res, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return send(res, 400, "Requête invalide"); }
  let rel = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  if (rel.endsWith("/")) rel += "index.html";
  let file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) return send(res, 403, "Forbidden");
  try {
    let s = await stat(file);
    if (s.isDirectory()) { file = join(file, "index.html"); s = await stat(file); }
    const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
    const cache = type.startsWith("text/html") ? "no-cache" : "public, max-age=604800";
    return await sendFile(req, res, file, type, cache);
  } catch {
    // URL propre sans extension : /contact → contact.html
    if (!extname(rel)) {
      try {
        return await sendFile(req, res, join(ROOT, `${rel}.html`), TYPES[".html"], "no-cache");
      } catch { /* 404 ci-dessous */ }
    }
    return send(res, 404, "Page introuvable", { "Content-Type": "text/plain; charset=utf-8" });
  }
}

createServer(async (req, res) => {
  if (String(req.headers.host || "").split(":")[0] !== CANONICAL_HOST) res.setHeader("X-Robots-Tag", "noindex");
  try {
    // Pas de new URL(req.url, base) : « // » ou « //x » y est lu comme un hôte et lève une
    // exception — hors du try, elle arrêtait tout le processus (une requête = pod en panne).
    const pathname = "/" + String(req.url || "/").split("?")[0].replace(/^\/+/, "");
    if (pathname === "/healthz") return send(res, 200, "ok", { "Content-Type": "text/plain" });
    if (pathname === "/api/version") {
      return send(res, 200, JSON.stringify({ sha: GIT_SHA }), { "Content-Type": "application/json", "Cache-Control": "no-store" });
    }
    if (pathname === "/api/contact") {
      if (req.method !== "POST") return send(res, 405, "Method Not Allowed", { Allow: "POST" });
      return await handleContact(req, res);
    }
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed");
    return await serveStatic(req, res, pathname);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, "Erreur interne");
  }
}).listen(PORT, () => console.log(`lien-du-coeur-pharma ${GIT_SHA} sur :${PORT}`));
