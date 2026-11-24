# samu-cast.github.io

Sito personale di Samuele Castellani. HTML e CSS statici più un solo script nostro (animazione del nome), zero richieste a terzi.

## Struttura

```
index.html                 pagina principale
404.html                   pagina di errore
assets/style.css           tutti gli stili
assets/fonts/              Anton e Fira Sans, self-hosted (licenza SIL OFL inclusa)
assets/favicon.svg
.well-known/security.txt   contatto per segnalazioni di sicurezza (RFC 9116)
_headers                   header HTTP di sicurezza (Cloudflare Pages / Netlify)
.nojekyll                  dice a GitHub Pages di servire anche .well-known/
robots.txt
```

## Pubblicare su GitHub Pages

1. Copia tutto il contenuto di questa cartella (anche i file nascosti `.nojekyll` e `.well-known/`) nella root del repo `Samu-Cast.github.io`.
2. `git add -A && git commit -m "First version of the site" && git push`
3. Settings → Pages → Deploy from a branch → `main` / `(root)`.
4. Il sito è su https://samu-cast.github.io

## Da completare

- `index.html`: cerca `TODO`. Nome e data dell'hackathon al PoliTo, card CyberChallenge (commentata), link ai repo dei progetti (commentati), email (commentata).
- `.well-known/security.txt`: quando hai l'indirizzo definitivo aggiungi la riga `Canonical:` e, se vuoi, un contatto email. Rinnova `Expires` prima della scadenza (max 1 anno).

## Sicurezza

Cosa c'è già:
- Content Security Policy `default-src 'none'` con `script-src 'self'`: gira solo `assets/hero.js`, nessuno script inline o esterno. In più Trusted Types blocca le iniezioni nel DOM.
- Nessuna risorsa esterna (font inclusi), quindi niente supply chain di terzi e niente tracciamento.
- `Referrer-Policy: no-referrer`, link esterni con `rel="noopener noreferrer"`.
- Il CV non è nel repo: i link puntano all'ultima release di https://github.com/Samu-Cast/Resume (tag `latest`), che si aggiorna da sola a ogni push del `.tex`.

Limite di GitHub Pages: non permette header HTTP custom. Il CSP funziona via `<meta>`, ma mancano HSTS personalizzato, anti-clickjacking (`frame-ancestors`, `X-Frame-Options`), `Permissions-Policy` ecc. Per avere tutto: pubblica lo stesso repo su **Cloudflare Pages**, che legge il file `_headers`.

Checklist account (il vero punto debole):
- [ ] 2FA su GitHub con passkey o chiave hardware
- [ ] Branch protection su `main`
- [ ] Mai segreti nel repo, nemmeno nella history
- [ ] Con un dominio tuo: 2FA sul registrar, DNSSEC, dominio verificato su GitHub/Cloudflare, rimuovi i record DNS se un giorno togli il sito (subdomain takeover)

Verifica finale: https://developer.mozilla.org/en-US/observatory
