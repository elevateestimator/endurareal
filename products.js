// Products page — tilt, filters, quick‑view (sticky head), scroll reveals, iPhone-safe tweaks
(function(){
  const doc = document;
  const $ = (s, r=doc) => r.querySelector(s);
  const $$ = (s, r=doc) => Array.from(r.querySelectorAll(s));

  // Centralize the estimate URL for cross-page scroll to LP form
  const ESTIMATE_URL = 'https://enduraroofing.ca/?id=estimate';

  // iPhone scroll safety (passive listeners)
  document.addEventListener('touchmove', () => {}, { passive: true });

  // Tilt effect (disabled on coarse pointers for natural scroll)
  const isCoarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
  const cards = $$('.product-card.tilt');
  if(!isCoarse){
    cards.forEach(card => {
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const cx = x / rect.width, cy = y / rect.height;
        const rx = (cy - .5) * -6; // rotateX
        const ry = (cx - .5) * 6;  // rotateY
        card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        card.style.setProperty('--mx', (cx*100).toFixed(1) + '%');
        card.style.setProperty('--my', (cy*100).toFixed(1) + '%');
        cancelAnimationFrame(raf); raf = requestAnimationFrame(()=>{});
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  // Scroll reveal for product cards
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  $$('.product-card[data-animate]').forEach((card, i) => {
    card.style.transitionDelay = (i * 40) + 'ms';
    revealObserver.observe(card);
  });

  // Filters with animated show/hide
  const filterButtons = $$('.chip[data-filter]');
  const gridCards = $$('.product-card');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const filter = btn.dataset.filter;

      gridCards.forEach(card => {
        const type = card.dataset.type || '';
        const shouldShow =
          filter === 'all' ||
          (filter === 'metal' && type === 'metal') ||
          (filter === 'shingle' && type === 'shingle') ||
          (filter === 'exterior' && type === 'exterior');

        if(shouldShow){
          if(card.style.display === 'none'){
            card.style.display = '';
            requestAnimationFrame(() => {
              card.classList.remove('is-hiding');
              card.classList.add('is-revealed');
            });
          } else {
            card.classList.remove('is-hiding');
            card.classList.add('is-revealed');
          }
        } else {
          card.classList.add('is-hiding');
          card.classList.remove('is-revealed');
          card.addEventListener('transitionend', () => {
            card.style.display = 'none';
          }, { once: true });
        }
      });
    });
  });

  // Quick View modal with sticky header (close not on photo)
  const qv = createQuickView();
  function createQuickView(){
    const el = document.createElement('div');
    el.className = 'modal'; el.id = 'quickview'; el.hidden = true;
    el.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="qv-title">
        <div class="modal-head">
          <h3 id="qv-title"></h3>
          <button class="modal-close" aria-label="Close" data-close>×</button>
        </div>
        <div class="modal-inner">
          <div class="modal-media"><img alt="" id="qv-img"></div>
          <div class="modal-body">
            <p id="qv-sub" class="sub"></p>
            <div class="modal-specs" id="qv-specs"></div>
            <div class="modal-actions">
              <a class="button button-primary" href="${ESTIMATE_URL}">Start Your Estimate</a>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);

    // Close handlers
    el.addEventListener('click', (e)=>{ if(e.target.matches('[data-close]')) closeQV(); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && !el.hidden) closeQV(); });

    return el;
  }

  function openQV(data){
    $('#qv-img').src = data.image || '';
    $('#qv-img').alt = data.name || '';
    $('#qv-title').textContent = data.name || '';
    $('#qv-sub').textContent = data.look || '';

    const specs = $('#qv-specs'); specs.innerHTML = '';
    const rows = [
      ['Longevity', data.longevity],
      ['Fasteners', data.fasteners],
      ['Warranty', data.warranty],
      ['Gauge / Material', data.gauge],
      ['Best for', data.bestfor],
      ['Finishes', data.finishes]
    ];
    rows.forEach(([k,v])=>{
      if(!v) return;
      const div = document.createElement('div');
      div.className = 'spec';
      div.innerHTML = `<strong>${k}</strong><div style="color:var(--text-dim)">${v}</div>`;
      specs.appendChild(div);
    });

    qv.hidden = false;
    requestAnimationFrame(() => qv.classList.add('is-open'));
    trapFocus(qv);
  }

  function closeQV(){
    qv.classList.remove('is-open');
    qv.addEventListener('transitionend', () => {
      qv.hidden = true;
      releaseFocus();
    }, { once: true });
  }

  // Quick View triggers
  $$('.js-quick-view').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      if(!card) return;
      openQV(cardData(card));
    });
  });

  function cardData(card){
    return {
      id: card.dataset.id,
      name: card.dataset.name,
      type: card.dataset.type,
      image: card.dataset.image,
      fasteners: card.dataset.fasteners,
      longevity: card.dataset.longevity,
      warranty: card.dataset.warranty,
      gauge: card.dataset.gauge,
      look: card.dataset.look,
      bestfor: card.dataset.bestfor,
      finishes: card.dataset.finishes
    };
  }

  // Animate <details> open/close (Buying Tips)
  setupDetails('.faq details');
  function setupDetails(selector){
    $$(selector).forEach(det => {
      const summary = det.querySelector('summary');
      if(!summary) return;
      const rest = Array.from(det.childNodes).filter(n => n.nodeType === 1 && n.tagName.toLowerCase() !== 'summary');
      const wrap = document.createElement('div');
      wrap.className = 'details-content';
      wrap.style.maxHeight = '0px';
      wrap.style.transition = 'max-height .28s cubic-bezier(.22,.61,.36,1)';
      rest.forEach(el => wrap.appendChild(el));
      det.appendChild(wrap);

      if(!det.hasAttribute('open')) wrap.style.maxHeight = '0px';

      det.addEventListener('toggle', () => {
        const open = det.open;
        if(open){
          wrap.style.maxHeight = wrap.scrollHeight + 'px';
          wrap.addEventListener('transitionend', () => {
            wrap.style.maxHeight = 'none';
          }, { once: true });
        } else {
          const h = wrap.scrollHeight;
          wrap.style.maxHeight = h + 'px';
          requestAnimationFrame(() => wrap.style.maxHeight = '0px');
        }
      });
    });
  }

  // Focus trap for modal
  let lastFocused = null;
  function trapFocus(container){
    lastFocused = document.activeElement;
    const selectors = [
      'a[href]','button','input','select','textarea','[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const focusables = $$(selectors, container).filter(el => !el.hasAttribute('disabled'));
    if(focusables.length) focusables[0].focus();

    container.addEventListener('keydown', onTrap);
    function onTrap(e){
      if(e.key !== 'Tab') return;
      const idx = focusables.indexOf(document.activeElement);
      if(e.shiftKey && (idx <= 0)){ e.preventDefault(); focusables[focusables.length - 1].focus(); }
      else if(!e.shiftKey && (idx === focusables.length - 1)){ e.preventDefault(); focusables[0].focus(); }
    }
    container._trap = onTrap;
  }
  function releaseFocus(){
    const open = $('#quickview');
    if(open && open._trap) open.removeEventListener('keydown', open._trap);
    if(lastFocused) lastFocused.focus({preventScroll:true});
  }
})();
