# Cloudflare connectivity fix for marketalgeria.store

This project-level note covers the intermittent case where the site does not load without a VPN, while it loads normally from other networks or through a VPN.

## What is already known

- `marketalgeria.store` uses Cloudflare nameservers.
- The public DNS response includes Cloudflare IPv4 and IPv6 addresses.
- The reported failure is a browser/network load failure, not a visible Cloudflare block page.
- That pattern usually points to ISP routing, DNS, IPv6, HTTP/3/QUIC, or Cloudflare proxy settings.

## First diagnostic

Run this from a network where the site fails without VPN:

```bash
npm run diagnose:cloudflare
```

If possible, run it twice:

- once with VPN off
- once with VPN on

The most useful comparison is whether IPv4 works while IPv6 fails.

## Cloudflare changes to try

Apply one change at a time, wait 2-5 minutes, then test again without VPN.

1. Disable HTTP/3/QUIC temporarily.
2. Disable 0-RTT temporarily.
3. Check Security Events for Algerian visitors or the affected IP address. If requests are challenged or blocked, relax the matching rule or add a narrow allow rule.
4. Confirm SSL/TLS mode is `Full (strict)`, not `Flexible`, if the origin has a valid Netlify certificate.
5. Temporarily switch the DNS record from proxied to DNS-only. If DNS-only fixes the issue, the problem is in Cloudflare proxy/routing/security rather than the site code.

## DNS baseline for Netlify origin

If the site is hosted on Netlify and Cloudflare is used as external DNS:

- root/apex record: `A` to `75.2.60.5`
- `www` record: `CNAME` to the Netlify site hostname

After changing DNS, keep Cloudflare proxy off only for the short isolation test unless you intentionally want to bypass Cloudflare.

## Device/network tests

On affected devices:

- Try DNS `1.1.1.1` / `1.0.0.1`.
- Try DNS `8.8.8.8` / `8.8.4.4`.
- Temporarily disable IPv6 and retest.
- Record the exact browser error, for example `ERR_CONNECTION_RESET`, `DNS_PROBE_FINISHED`, or timeout.

## Decision guide

- IPv4 OK, IPv6 failed: treat it as an IPv6/ISP route issue first.
- Both IPv4 and IPv6 fail, but VPN works: inspect Cloudflare Security Events and proxy settings.
- DNS-only fixes it: Cloudflare proxy path or security settings are the cause.
- DNS-only does not fix it: inspect Netlify custom domain, SSL certificate, and origin availability.
