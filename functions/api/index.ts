interface Env {
  BACKEND_ORIGIN?: string;
}

export async function onRequest(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const origin = context.env.BACKEND_ORIGIN?.trim();
  if (!origin) {
    return Response.json({ ok: false, error: "Backend is not configured" }, { status: 503 });
  }

  let target: URL;
  try {
    target = new URL(new URL(context.request.url).search, origin);
  } catch {
    return Response.json({ ok: false, error: "Invalid BACKEND_ORIGIN" }, { status: 500 });
  }

  try {
    const upstream = await fetch(target, {
      method: context.request.method,
      headers: context.request.headers,
      body: ["GET", "HEAD"].includes(context.request.method) ? undefined : context.request.body,
      redirect: "manual",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    });
  } catch {
    return Response.json({ ok: false, error: "Backend connection failed" }, { status: 502 });
  }
}
