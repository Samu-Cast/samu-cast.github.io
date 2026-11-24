# samuelecastellani.dev

Personal website of Samuele Castellani, cybersecurity engineering student at Politecnico di Torino.

**Live:** https://samuelecastellani.dev · **Mozilla Observatory:** A+ (160/100)

Hand-written HTML and CSS, plus a few small first-party scripts (bit-cascade animation, scroll indicator, email link). No frameworks, no trackers, no third-party requests.

## Structure

```
index.html                 main page
404.html                   error page
assets/style.css           all styles
assets/hero.js             bit-cascade animation of the name (canvas)
assets/rails.js            centered scroll indicator for the horizontal rows
assets/contact.js          builds the email link at runtime (keeps the address out of the HTML)
assets/fonts/              Anton and Fira Sans, self-hosted (SIL OFL licenses included)
assets/favicon.svg
.well-known/security.txt   security contact (RFC 9116)
_headers                   HTTP security headers (read by Cloudflare Pages)
robots.txt
```

## Hosting and deployment

- Code on GitHub, hosted on **Cloudflare Pages**: every push to `main` is deployed automatically.
- Domain registered on Cloudflare, with DNSSEC enabled.
- The CV is not stored here: the links point to the `latest` release of [Samu-Cast/Resume](https://github.com/Samu-Cast/Resume), rebuilt from LaTeX by GitHub Actions on every change.

## Security

- **Content Security Policy:** `default-src 'none'`, scripts and styles only from the site itself, no inline code, `frame-ancestors 'none'`, `form-action 'none'`.
- **Trusted Types** enforced (`require-trusted-types-for 'script'`): the browser blocks DOM injection sinks.
- **Isolation headers:** COOP `same-origin`, COEP `require-corp`, CORP `same-origin`.
- **Other headers:** HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, restrictive `Permissions-Policy`.
- `.dev` is on the HSTS preload list, so the site is HTTPS-only by design.
- No external resources at all (fonts included): no third-party supply chain, no tracking.
- The animations respect `prefers-reduced-motion`, and the page works without JavaScript.

## Maintenance

- Renew `Expires` in `.well-known/security.txt` before **2027-11-24** (max one year ahead).
- Never commit secrets; keep 2FA on GitHub and Cloudflare.
