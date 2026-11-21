/**
 * CineVerse API bridge for Cloudflare Pages.
 *
 * Set BACKEND_ORIGIN to the HTTPS origin of the separate Node/Express server,
 * for example https://cineverse-api.example.com (no trailing path).
 * If it is not configured, fail clearly without breaking the static frontend.
 */
type Env = { BACKEND_ORIGIN?: string };

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const configuredOrigin = String(env?.BACKEND_ORIGIN || "").trim();

  if (!configuredOrigin) {
    return Response.json(
      {
        ok: false,
        mode: "backend-not-configured",
        error: "BACKEND_ORIGIN is not configured for this Cloudflare Pages deployment.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-CineVerse-Mode": "backend-not-configured",
        },
      }
    );
  }

  let backend: URL;
  try {
    backend = new URL(configuredOrigin);
    if (backend.protocol !== "https:" || backend.username || backend.password) {
      throw new Error("BACKEND_ORIGIN must be a valid HTTPS origin.");
    }
    if (backend.pathname !== "/" || backend.search || backend.hash) {
      throw new Error("BACKEND_ORIGIN must contain only the backend origin.");
    }
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mode: "backend-config-error",
        error: error instanceof Error ? error.message : "Invalid BACKEND_ORIGIN.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, backend.origin);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("X-Forwarded-Host", incoming.host);
  headers.set("X-Forwarded-Proto", incoming.protocol.replace(":", ""));

  try {
    const method = request.method.toUpperCase();
    const upstream = await fetch(target.toString(), {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-CineVerse-Mode", "backend-proxy");
    responseHeaders.delete("content-length");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mode: "backend-unreachable",
        error: error instanceof Error ? error.message : "Could not reach CineVerse backend.",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
          "X-CineVerse-Mode": "backend-unreachable",
        },
      }
    );
  }
}
