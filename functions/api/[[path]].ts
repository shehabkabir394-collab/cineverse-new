interface Env {
  BACKEND_ORIGIN?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const origin = context.env.BACKEND_ORIGIN?.trim();

  if (!origin) {
    return Response.json(
      {
        ok: false,
        error: "Backend is not configured",
        message: "Set the BACKEND_ORIGIN environment variable in Cloudflare Pages.",
      },
      { status: 503 }
    );
  }

  let backend: URL;
  try {
    backend = new URL(origin);
    if (backend.protocol !== "https:" && backend.hostname !== "localhost" && backend.hostname !== "127.0.0.1") {
      throw new Error("HTTPS is required");
    }
  } catch {
    return Response.json({ ok: false, error: "Invalid BACKEND_ORIGIN" }, { status: 500 });
  }

  const incoming = new URL(context.request.url);
  const target = new URL(incoming.pathname + incoming.search, backend);

  try {
    const headers = new Headers(context.request.headers);
    headers.delete("host");
    headers.delete("content-length");

    const upstream = await fetch(target, {
      method: context.request.method,
      headers,
      body: ["GET", "HEAD"].includes(context.request.method) ? undefined : context.request.body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.set("Access-Control-Allow-Origin", incoming.origin);
    responseHeaders.set("Vary", "Origin");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "Backend connection failed",
        message: error instanceof Error ? error.message : "Unknown connection error",
      },
      { status: 502 }
    );
  }
}
