export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = '*'; // Po nasazení změnit na konkrétní doménu

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Api-Key, x-api-key, anthropic-version',
      }
    });
  }

  const url = new URL(req.url);
  const target = url.searchParams.get('target'); // 'flowii' nebo 'claude'
  const path = url.searchParams.get('path') || '';

  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Api-Key, x-api-key, anthropic-version',
  };

  try {
    let targetUrl, fetchOptions;

    // ── FLOWII ──────────────────────────────────────────────
    if (target === 'flowii') {
      targetUrl = `https://api.flowii.com/${path}`;
      const body = req.method !== 'GET' ? await req.text() : undefined;

      fetchOptions = {
        method: req.method,
        headers: {
          'Content-Type': req.headers.get('Content-Type') || 'application/json',
          'Authorization': req.headers.get('Authorization') || '',
          'Api-Key': req.headers.get('Api-Key') || '',
        },
        body
      };
    }

    // ── CLAUDE / ANTHROPIC ──────────────────────────────────
    else if (target === 'claude') {
      targetUrl = `https://api.anthropic.com/${path}`;
      const body = await req.text();

      fetchOptions = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': req.headers.get('x-api-key') || '',
          'anthropic-version': req.headers.get('anthropic-version') || '2023-06-01',
        },
        body
      };
    }

    // ── NEZNÁMÝ TARGET ──────────────────────────────────────
    else {
      return new Response(JSON.stringify({ error: 'Unknown target' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
