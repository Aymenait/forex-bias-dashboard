/**
 * Meta Conversions API — Cloudflare Pages Function
 * URL: /capi (POST)
 *
 * Required Cloudflare Pages env vars (Settings → Environment variables):
 *   META_PIXEL_ID       — 2046893892791206
 *   META_CAPI_TOKEN     — Conversions API access token (Events Manager → Settings)
 *   META_TEST_EVENT_CODE (optional) — for Events Manager → Test Events
 */
const GRAPH_VERSION = 'v19.0';

export async function onRequestPost(context) {
    const { request, env } = context;

    const PIXEL_ID = env.META_PIXEL_ID;
    const TOKEN = env.META_CAPI_TOKEN;
    const TEST_CODE = env.META_TEST_EVENT_CODE || '';

    if (!PIXEL_ID || !TOKEN) {
        return new Response('Server not configured', { status: 500, headers: corsHeaders() });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response('Invalid JSON', { status: 400, headers: corsHeaders() });
    }

    const {
        event_name,
        event_id,
        event_time,
        event_source_url,
        action_source = 'website',
        user_data = {},
        custom_data = {}
    } = body;

    if (!event_name) {
        return new Response('event_name required', { status: 400, headers: corsHeaders() });
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || '';
    const userAgent = request.headers.get('User-Agent') || '';

    const payload = {
        data: [{
            event_name,
            event_time: event_time || Math.floor(Date.now() / 1000),
            event_id,
            event_source_url,
            action_source,
            user_data: {
                ...user_data,
                client_ip_address: clientIp,
                client_user_agent: userAgent
            },
            custom_data
        }]
    };
    if (TEST_CODE) payload.test_event_code = TEST_CODE;

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        if (!res.ok) {
            console.error('[capi] Meta API error', res.status, text);
            return new Response(text, { status: 502, headers: corsHeaders() });
        }
        return new Response(text, { status: 200, headers: corsHeaders() });
    } catch (e) {
        console.error('[capi] fetch failed', e);
        return new Response('Upstream failure', { status: 500, headers: corsHeaders() });
    }
}

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
}
