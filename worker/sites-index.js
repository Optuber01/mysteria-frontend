const API_ORIGIN = 'https://api.mysterria.net';

function isDocumentRequest(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

async function serveApp(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404 || !isDocumentRequest(request)) return response;

  const indexUrl = new URL('/index.html', request.url);
  return env.ASSETS.fetch(new Request(indexUrl, request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const upstream = new URL(`${url.pathname}${url.search}`, API_ORIGIN);
      return fetch(new Request(upstream, request));
    }

    return serveApp(request, env);
  },
};
