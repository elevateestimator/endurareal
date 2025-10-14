// Header scroll shadow
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll);
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('site-nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    nav.hidden = expanded;
    document.body.classList.toggle('nav-open', !expanded);
  });

  // Close nav when a link is clicked (mobile)
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.hidden = true;
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    });
  });
}

// Quote form (production: send to Vercel function)
const form = document.getElementById('quoteForm');
const status = document.getElementById('formStatus');

if (form && status) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // Basic requireds (your backend also enforces name & phone)
    if (!data.name || !data.phone || !data.address) {
      status.textContent = 'Please fill the required fields.';
      status.style.color = '#b91c1c';
      return;
    }

    // Include email if you add it to the HTML; it's optional server-side
    // e.g., <input name="email" type="email" placeholder="you@example.com" />
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      message: data.message || ''
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const restoreText = submitBtn ? submitBtn.textContent : '';
    try {
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      status.textContent = '';

      const r = await fetch('/api/send-estimate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      if (!r.ok) {
        const err = await r.json().catch(()=>({error:'send_failed'}));
        throw new Error(err.error || `Request failed: ${r.status}`);
      }

      form.reset();
      status.style.color = 'var(--success)';
      status.textContent = 'Thanks! We received your request.';
    } catch (err) {
      console.error(err);
      status.style.color = '#b91c1c';
      status.textContent = 'Sorry—could not send. Please call (705) 903‑7663.';
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = restoreText; }
      setTimeout(() => (status.textContent = ''), 8000);
    }
  });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
