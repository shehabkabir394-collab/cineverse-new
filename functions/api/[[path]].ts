/**
 * CineVerse Cloudflare Pages Free mode.
 *
 * There is no Express/FFmpeg origin on the Free static deployment.
 * Returning a non-2xx response lets the browser client continue into its
 * built-in static snapshot + direct mirror fallback engine.
 */
export async function onRequest(context: { request: Request }): Promise<Response> {
  return Response.json(
    {
      ok: false,
      mode: "static-free",
      error: "Dynamic server API is not enabled on this Cloudflare Free deployment.",
      fallback: "The client will use static-db.json and browser-side sources where available.",
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "X-CineVerse-Mode": "static-free",
      },
    }
  );
}
