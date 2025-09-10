// Optional convenience: set current year; let you easily change effective date in HTML later.
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Only auto-fill the effective date if you forgot to replace the placeholder.
  const eff = document.getElementById('effective-date');
  if (eff && /\[Month Day, Year\]/.test(eff.textContent)) {
    const now = new Date();
    const fmt = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    eff.textContent = fmt;
  }
})();
