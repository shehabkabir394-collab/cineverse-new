/**
 * Cloudflare Pages Function: direct download gateway.
 * Decodes the URL token in the browser/serverless edge and redirects without
 * requiring the Node/Express backend.
 */
export async function onRequest({ request }: { request: Request }): Promise<Response> {
  const incoming = new URL(request.url);
  const token = incoming.searchParams.get("t") || "";
  if (!token || token.length > 8192) {
    return new Response("Invalid gateway link", { status: 400 });
  }
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const target = new URL(decoded);
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return new Response("Unsupported gateway URL", { status: 400 });
    }
    if (/fifadekho\.com$/i.test(target.hostname) && !target.searchParams.has("view")) {
      target.searchParams.set("view", "links");
    }
    return Response.redirect(target.toString(), 302);
  } catch {
    return new Response("Invalid gateway token", { status: 400 });
  }
}
