// Endura Roofing — LP interactions: gradient on scroll, progress, parallax, form, logo fallback
(function(){
  // Reading progress + gradient drift
  const bar = document.querySelector('.progress span');
  const root = document.documentElement;

  let ticking = false;
  function onScroll(){
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const doc = document.documentElement;
    const height = doc.scrollHeight - doc.clientHeight;
    const p = Math.max(0, Math.min(1, height ? scrollTop / height : 0));

    if(bar) bar.style.width = (p*100).toFixed(1) + '%';

    // Dynamic gradient hues / positions
    const baseHue = 207;
    const hue = baseHue + p * 24; // blue -> cyan
    const l1 = 50 - p * 8;
    const l2 = 22 - p * 4;
    const g1x = 72 - p * 20;
    const g1y = 10 + p * 6;
    const g2x = 16 + p * 18;
    const g2y = 26 + p * 10;

    root.style.setProperty('--h', hue.toFixed(2));
    root.style.setProperty('--l1', l1.toFixed(2) + '%');
    root.style.setProperty('--l2', l2.toFixed(2) + '%');
    root.style.setProperty('--g1x', g1x.toFixed(2) + '%');
    root.style.setProperty('--g1y', g1y.toFixed(2) + '%');
    root.style.setProperty('--g2x', g2x.toFixed(2) + '%');
    root.style.setProperty('--g2y', g2y.toFixed(2) + '%');

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if(!ticking){ requestAnimationFrame(onScroll); ticking = true; }
  }, {passive:true});
  onScroll();

  // Parallax (subtle & safe)
  const pw = document.querySelector('[data-parallax]');
  const pimg = pw ? pw.querySelector('.parallax-img') : null;
  if(pw && pimg){
    let active = false;
    const io = new IntersectionObserver((entries)=>{
      active = entries.some(e => e.isIntersecting);
    }, {rootMargin: '200px 0px'});
    io.observe(pw);

    let lastY = 0, rafId = 0;
    function parallax(){
      if(!active){ rafId = requestAnimationFrame(parallax); return; }
      const rect = pw.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const center = rect.top + rect.height/2;
      const delta = (center - vh/2);
      const move = Math.max(-60, Math.min(60, -delta * 0.06));
      if(Math.abs(move - lastY) > 0.5){
        pimg.style.transform = `translate3d(0, ${move.toFixed(1)}px, 0) scale(1.05)`;
        lastY = move;
      }
      rafId = requestAnimationFrame(parallax);
    }
    rafId = requestAnimationFrame(parallax);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if(mq.matches){
      cancelAnimationFrame(rafId);
      pimg.style.transform = 'none';
    }
  }

  // Form handling (Postmark via serverless; mailto fallback)
  const form = document.getElementById('quote-form');
  const status = document.getElementById('form-status');
  if(form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if(!data.name || !data.phone){
        status.textContent = 'Please provide your name and phone number.';
        status.style.color = '#ff8a8a';
        return;
      }

      // Keep your local history
      const leads = JSON.parse(localStorage.getItem('endura_leads') || '[]');
      leads.push({...data, ts: Date.now()});
      localStorage.setItem('endura_leads', JSON.stringify(leads));

      // Try API first
      try {
        const r = await fetch('/api/send-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if(!r.ok) throw new Error('send failed');
        status.textContent = 'Thanks! We got your request and will call you right away.';
        status.style.color = '';
        form.reset();
      } catch (err) {
        // Fallback: open the mail app (preserves current behavior)
        const subject = encodeURIComponent('New Estimate Request — Endura Roofing');
        const body = encodeURIComponent(`Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email || ''}
Address: ${data.address || ''}
Details: ${data.message || ''}`);
        window.location.href = `mailto:info@enduraroofing.ca?subject=${subject}&body=${body}`;
        status.textContent = 'Thanks! If your mail app opened, you can also hit send there.';
      }
    });
  }

  // Logo fallback
  const logo = document.querySelector('.brand .logo');
  const brandText = document.querySelector('.brand .brand-text');
  if(logo){
    logo.addEventListener('error', () => {
      if(brandText){ brandText.style.display = 'inline-block'; }
      logo.style.display = 'none';
    }, { once:true });
  }
})();