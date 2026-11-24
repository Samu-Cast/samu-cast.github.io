// Builds the email link at runtime, so the address never appears in the HTML
// that scrapers download. Without JavaScript the link falls back to LinkedIn
// and the address stays readable as "hello [at] samuelecastellani [dot] dev".
(() => {
  'use strict';
  document.querySelectorAll('a.js-mail').forEach((a) => {
    const user = a.dataset.user;
    const host = a.dataset.host;
    if (!user || !host) return;
    const address = `${user}@${host}`;
    a.href = `mailto:${address}`;
    a.removeAttribute('rel');
    const handle = a.querySelector('.contact__handle');
    if (handle) handle.textContent = address;
  });
})();
