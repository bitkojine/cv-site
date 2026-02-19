import type { MiddlewareHandler } from 'astro';

const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const onRequest: MiddlewareHandler = async (context, next) => {
  const method = context.request.method.toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    return new Response(
      JSON.stringify({
        error: 'method_not_allowed',
        message: `Method ${method} is not allowed for this site.`,
      }),
      {
        status: 405,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          allow: 'GET, HEAD, OPTIONS',
        },
      }
    );
  }
  return next();
};
