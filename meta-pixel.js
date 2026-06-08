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
    var recentEvents = {};
    var RECENT_EVENT_TTL_MS = 1500;
    var STANDARD_EVENTS = {
        PageView: true,
        ViewContent: true,
        Search: true,
        AddToCart: true,
        AddToWishlist: true,
        InitiateCheckout: true,
        AddPaymentInfo: true,
        Purchase: true,
        Lead: true,
        CompleteRegistration: true,
        Contact: true,
        CustomizeProduct: true,
        Donate: true,
        FindLocation: true,
        Schedule: true,
        StartTrial: true,
        SubmitApplication: true,
        Subscribe: true
    };

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
        var fbclid = params.get('fbclid') || '';
        try {
            fbclid = fbclid || window.localStorage.getItem('fbclid') || '';
        } catch (e) {
            fbclid = fbclid || '';
        }
        if (fbclid) return fbcFromFbclid(fbclid);
        return '';
    }

    function persistFbclid() {
        try {
            var fbclid = new URLSearchParams(window.location.search).get('fbclid');
            if (fbclid) window.localStorage.setItem('fbclid', fbclid);
        } catch (e) {
            // Storage can be unavailable in private browsing; tracking still works without it.
        }
    }

    function getFbp() {
        return getCookie('_fbp');
    }

    function fbcFromFbclid(fbclid, timestampMs) {
        if (!fbclid) return '';
        return 'fb.1.' + (timestampMs || Date.now()) + '.' + fbclid;
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

    function eventSignature(eventName, params) {
        params = params || {};
        return [
            eventName,
            params.content_name || '',
            Array.isArray(params.content_ids) ? params.content_ids.join(',') : (params.content_ids || ''),
            params.value || '',
            params.currency || ''
        ].join('|');
    }

    function isStandardEvent(eventName) {
        return !!STANDARD_EVENTS[eventName];
    }

    function shouldTrackEvent(eventName, params, options) {
        options = options || {};
        if (options.skipDedupe) return true;
        var now = Date.now();
        Object.keys(recentEvents).forEach(function (key) {
            if (now - recentEvents[key] > RECENT_EVENT_TTL_MS) delete recentEvents[key];
        });
        var signature = eventSignature(eventName, params);
        if (recentEvents[signature] && now - recentEvents[signature] < RECENT_EVENT_TTL_MS) {
            return false;
        }
        recentEvents[signature] = now;
        return true;
    }

    function sendCapi(eventName, params, userData, eventId, eventTime, eventSourceUrl, options) {
        options = options || {};
        var capiUserData = Object.assign({}, userData || {});
        if (options.includeBrowserIdentifiers !== false) {
            var fbp = getFbp();
            var fbc = getFbc();
            if (fbp && !capiUserData.fbp) capiUserData.fbp = fbp;
            if (fbc && !capiUserData.fbc) capiUserData.fbc = fbc;
        }

        return fetch(CAPI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                event_name: eventName,
                event_id: eventId,
                event_time: eventTime,
                event_source_url: eventSourceUrl,
                action_source: options.actionSource || 'website',
                user_data: capiUserData,
                custom_data: params
            })
        });
    }

    // ── Init ──────────────────────────────────────────────────────
    function callBrowserPixel(args) {
        if (!window.fbq) return;
        if (window.fbq.__metaPixelBridge && typeof window.fbq.callMethod === 'function') {
            return window.fbq.callMethod.apply(window.fbq, args);
        }
        if (window.fbq.__metaPixelBridge && window.fbq.__rawFbq && typeof window.fbq.__rawFbq.callMethod === 'function') {
            return window.fbq.__rawFbq.callMethod.apply(window.fbq.__rawFbq, args);
        }
        return window.fbq.apply(window, args);
    }

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
    async function trackEvent(eventName, params, userData, options) {
        params = params || {};
        userData = userData || {};
        options = options || {};
        var eventId = options.eventId || uuid();
        var eventTime = options.eventTime || Math.floor(Date.now() / 1000);
        var eventSourceUrl = options.eventSourceUrl || window.location.href;
        var normalizedParams = normalizeValue(params);
        var includeBrowser = options.includeBrowser !== false;

        if (!shouldTrackEvent(eventName, normalizedParams, options)) {
            return eventId;
        }

        // 1) Client pixel (init guard)
        try {
            if (includeBrowser && typeof window.fbq !== 'undefined') {
                var command = isStandardEvent(eventName) ? 'trackSingle' : 'trackSingleCustom';
                callBrowserPixel([command, META_PIXEL_ID, eventName, normalizedParams, { eventID: eventId }]);
            }
        } catch (e) {
            console.warn('[meta-pixel] client track failed', e);
        }

        // 2) Server CAPI (best-effort, never blocks UX)
        try {
            var capiResponse = await sendCapi(eventName, normalizedParams, userData, eventId, eventTime, eventSourceUrl, options);
            if (options.requireCapiSuccess && capiResponse && !capiResponse.ok) {
                throw new Error('CAPI returned HTTP ' + capiResponse.status);
            }
        } catch (e) {
            if (options.requireCapiSuccess) throw e;
            console.warn('[meta-pixel] CAPI send failed', e);
        }

        return eventId;
    }

    function trackServerEvent(eventName, params, userData, options) {
        options = Object.assign({}, options || {}, {
            includeBrowser: false,
            includeBrowserIdentifiers: false,
            skipDedupe: true
        });
        return trackEvent(eventName, params, userData, options);
    }

    // ── Build hashed user_data from raw form fields ───────────────
    function installLegacyFbqBridge() {
        if (!window.fbq || window.fbq.__metaPixelBridge) return;
        var rawFbq = window.fbq;

        function invokeNative(args) {
            if (bridgedFbq && typeof bridgedFbq.callMethod === 'function') {
                return bridgedFbq.callMethod.apply(bridgedFbq, args);
            }
            if (typeof rawFbq.callMethod === 'function') {
                return rawFbq.callMethod.apply(rawFbq, args);
            }
            return rawFbq.apply(window, args);
        }

        bridgedFbq = function () {
            var args = Array.prototype.slice.call(arguments);
            var command = args[0];
            var eventName = args[1];

            if ((command === 'track' || command === 'trackCustom') && eventName && eventName !== 'PageView') {
                var params = normalizeValue(args[2] || {});
                var eventOptions = args[3] || {};
                var eventId = eventOptions.eventID || eventOptions.event_id || uuid();
                var eventTime = Math.floor(Date.now() / 1000);
                if (!shouldTrackEvent(eventName, params)) return;
                if (command === 'track' && !isStandardEvent(eventName)) {
                    args[0] = 'trackCustom';
                }
                args[2] = params;
                args[3] = Object.assign({}, eventOptions, { eventID: eventId });
                try {
                    invokeNative(args);
                    sendCapi(eventName, params, {}, eventId, eventTime, window.location.href, {})
                        .catch(function (e) { console.warn('[meta-pixel] legacy CAPI send failed', e); });
                    return;
                } catch (e) {
                    console.warn('[meta-pixel] legacy fbq bridge failed', e);
                }
            }

            return invokeNative(args);
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
    persistFbclid();
    initMetaPixel();
    installLegacyFbqBridge();
    setTimeout(installLegacyFbqBridge, 1500);

    // ── Public API ────────────────────────────────────────────────
    window.metaPixel = {
        PIXEL_ID: META_PIXEL_ID,
        init: initMetaPixel,
        trackEvent: trackEvent,
        trackServerEvent: trackServerEvent,
        normalizeValue: normalizeValue,
        buildUserData: buildUserData,
        fbcFromFbclid: fbcFromFbclid,
        sha256: sha256,
        normalizeEmail: normalizeEmail,
        normalizePhone: normalizePhone,
        getFbp: getFbp,
        getFbc: getFbc
    };
})(window, document);
