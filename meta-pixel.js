/**
 * Meta Pixel + Conversions API bridge — centralized config
 * Pixel ID and helpers used across the whole site.
 *
 * Public API (window.metaPixel):
 *   initMetaPixel(advancedMatching?)        — load fbevents.js + init + PageView
 *   trackEvent(name, params?, userData?)    — pixel + CAPI with shared event_id
 *   sha256(str)                              — SHA-256 hex (for PII hashing)
 *   normalizeEmail(s)                        — trim + lowercase
 *   normalizePhone(s, countryCode?)          — digits-only, country-prefixed
 */
(function (window, document) {
    'use strict';

    var META_PIXEL_ID = '2046893892791206';
    var CAPI_ENDPOINT = '/capi';
    var bridgedFbq = null;

    // ── Pixel loader (standard FB snippet) ────────────────────────
    function loadFbevents() {
        if (window.fbq) return;
        var n, t, s;
        n = window.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = document.createElement('script');
        t.async = true;
        t.src = 'https://connect.facebook.net/en_US/fbevents.js';
        t.onload = installLegacyFbqBridge;
        s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(t, s);
    }

    // ── UUID v4 (for event_id deduplication) ──────────────────────
    function uuid() {
        if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            var v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // ── SHA-256 hex (PII hashing for Advanced Matching) ───────────
    async function sha256(str) {
        if (!str) return '';
        var buf = new TextEncoder().encode(String(str));
        var hash = await window.crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash))
            .map(function (b) { return b.toString(16).padStart(2, '0'); })
            .join('');
    }

    function normalizeEmail(s) {
        return String(s || '').trim().toLowerCase();
    }

    function normalizePhone(s, countryCode) {
        var digits = String(s || '').replace(/\D/g, '');
        if (!digits) return '';
        var cc = String(countryCode || '').replace(/\D/g, '');
        if (digits.startsWith('00')) digits = digits.slice(2);
        if (cc && !digits.startsWith(cc)) {
            if (digits.startsWith('0')) digits = digits.slice(1);
            digits = cc + digits;
        }
        return digits;
    }

    // ── Cookie helpers (fbp / fbc for CAPI) ───────────────────────
    function getCookie(name) {
        var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
        return m ? decodeURIComponent(m[2]) : '';
    }

    function getFbc() {
        var existing = getCookie('_fbc');
        if (existing) return existing;
        var params = new URLSearchParams(window.location.search);
        var fbclid = params.get('fbclid');
        if (fbclid) return 'fb.1.' + Date.now() + '.' + fbclid;
        return '';
    }

    function getFbp() {
        return getCookie('_fbp');
    }

    function normalizeValue(params) {
        params = params || {};
        var normalized = Object.assign({}, params);
        if (normalized.currency === 'DZD' && normalized.value !== undefined) {
            var dzd = parseFloat(normalized.value) || 0;
            normalized.value = parseFloat((dzd / 250).toFixed(2));
            normalized.currency = 'USD';
            normalized.original_value = dzd;
            normalized.original_currency = 'DZD';
        }
        if (normalized.content_name && !normalized.content_ids) {
            normalized.content_ids = [String(normalized.content_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')];
        }
        if (normalized.content_name && !normalized.content_type) {
            normalized.content_type = 'product';
        }
        return normalized;
    }

    function sendCapi(eventName, params, userData, eventId, eventTime, eventSourceUrl) {
        var capiUserData = Object.assign({}, userData || {});
        var fbp = getFbp();
        var fbc = getFbc();
        if (fbp) capiUserData.fbp = fbp;
        if (fbc) capiUserData.fbc = fbc;

        return fetch(CAPI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                event_name: eventName,
                event_id: eventId,
                event_time: eventTime,
                event_source_url: eventSourceUrl,
                action_source: 'website',
                user_data: capiUserData,
                custom_data: params
            })
        });
    }

    // ── Init ──────────────────────────────────────────────────────
    function initMetaPixel(advancedMatching) {
        loadFbevents();
        if (advancedMatching && Object.keys(advancedMatching).length) {
            window.fbq('init', META_PIXEL_ID, advancedMatching);
        } else {
            window.fbq('init', META_PIXEL_ID);
        }
        window.fbq('track', 'PageView');
    }

    // ── trackEvent — pixel + CAPI with shared event_id ────────────
    async function trackEvent(eventName, params, userData) {
        params = params || {};
        userData = userData || {};
        var eventId = uuid();
        var eventTime = Math.floor(Date.now() / 1000);
        var eventSourceUrl = window.location.href;
        var normalizedParams = normalizeValue(params);

        // 1) Client pixel (init guard)
        try {
            if (typeof window.fbq !== 'undefined') {
                var fbqTarget = bridgedFbq && bridgedFbq.__rawFbq ? bridgedFbq.__rawFbq : window.fbq;
                fbqTarget('trackSingle', META_PIXEL_ID, eventName, normalizedParams, { eventID: eventId });
            }
        } catch (e) {
            console.warn('[meta-pixel] client track failed', e);
        }

        // 2) Server CAPI (best-effort, never blocks UX)
        try {
            await sendCapi(eventName, normalizedParams, userData, eventId, eventTime, eventSourceUrl);
        } catch (e) {
            console.warn('[meta-pixel] CAPI send failed', e);
        }

        return eventId;
    }

    // ── Build hashed user_data from raw form fields ───────────────
    function installLegacyFbqBridge() {
        if (!window.fbq || window.fbq.__metaPixelBridge || !window.fbq.callMethod) return;
        var rawFbq = window.fbq;
        bridgedFbq = function () {
            var args = Array.prototype.slice.call(arguments);
            var command = args[0];
            var eventName = args[1];

            if ((command === 'track' || command === 'trackCustom') && eventName && eventName !== 'PageView') {
                var params = normalizeValue(args[2] || {});
                var eventId = uuid();
                var eventTime = Math.floor(Date.now() / 1000);
                args[2] = params;
                args[3] = Object.assign({}, args[3] || {}, { eventID: eventId });
                try {
                    rawFbq.apply(window, args);
                    sendCapi(eventName, params, {}, eventId, eventTime, window.location.href)
                        .catch(function (e) { console.warn('[meta-pixel] legacy CAPI send failed', e); });
                    return;
                } catch (e) {
                    console.warn('[meta-pixel] legacy fbq bridge failed', e);
                }
            }

            return rawFbq.apply(window, args);
        };
        Object.keys(rawFbq).forEach(function (key) {
            bridgedFbq[key] = rawFbq[key];
        });
        bridgedFbq.__rawFbq = rawFbq;
        bridgedFbq.__metaPixelBridge = true;
        window.fbq = bridgedFbq;
    }

    async function buildUserData(raw) {
        raw = raw || {};
        var out = {};
        if (raw.email) out.em = await sha256(normalizeEmail(raw.email));
        if (raw.phone) out.ph = await sha256(normalizePhone(raw.phone, raw.countryCode));
        if (raw.firstName) out.fn = await sha256(String(raw.firstName).trim().toLowerCase());
        if (raw.lastName) out.ln = await sha256(String(raw.lastName).trim().toLowerCase());
        if (raw.country) out.country = await sha256(String(raw.country).trim().toLowerCase());
        if (raw.externalId) out.external_id = await sha256(String(raw.externalId));
        return out;
    }

    // ── Auto-init on script load (PageView for every page) ────────
    initMetaPixel();
    setTimeout(installLegacyFbqBridge, 1500);

    // ── Public API ────────────────────────────────────────────────
    window.metaPixel = {
        PIXEL_ID: META_PIXEL_ID,
        init: initMetaPixel,
        trackEvent: trackEvent,
        normalizeValue: normalizeValue,
        buildUserData: buildUserData,
        sha256: sha256,
        normalizeEmail: normalizeEmail,
        normalizePhone: normalizePhone,
        getFbp: getFbp,
        getFbc: getFbc
    };
})(window, document);
