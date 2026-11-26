(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Escalonar la entrada de cada platillo
  $$('.stagger').forEach(list => {
    [...list.querySelectorAll('.dish, .lic, .licg, .lich')].forEach((el, i) => {
      el.style.transitionDelay = Math.min(i * 45, 600) + 'ms';
    });
    const two = list.querySelector('.two');
    if (two) { two.style.opacity = 1; two.style.transform = 'none'; }
  });

  // Aparecer al hacer scroll
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal, .stagger, .gallery').forEach(el => io.observe(el));
  $$('.stagger .two').forEach(el => io.observe(el));

  // Navegación: sección activa + barra de progreso
  const chips = $$('.chip');
  const chipBox = $('.chips');
  const secs = chips.map(c => $(c.getAttribute('href')));
  const progress = $('.progress');
  const topBtn = $('.top');
  let current = null;
  // La barra solo se recorre si la pestaña activa no se ve completa, y nunca mientras el dedo está sobre ella
  let touchingBar = false;
  chipBox.addEventListener('pointerdown', () => { touchingBar = true; }, { passive: true });
  addEventListener('pointerup', () => { touchingBar = false; }, { passive: true });
  addEventListener('pointercancel', () => { touchingBar = false; }, { passive: true });
  const showChip = c => {
    if (touchingBar) return;
    const l = c.offsetLeft, r = l + c.offsetWidth, vl = chipBox.scrollLeft, vr = vl + chipBox.clientWidth;
    if (l >= vl + 8 && r <= vr - 8) return;
    chipBox.scrollTo({ left: l - chipBox.clientWidth / 2 + c.offsetWidth / 2, behavior: 'smooth' });
  };
  const setActive = id => {
    if (id === current) return;
    current = id;
    chips.forEach(c => {
      const on = c.getAttribute('href') === '#' + id;
      c.classList.toggle('on', on);
      if (on) showChip(c);
    });
  };
  const heroEl = $('.hero'), navEl = $('.nav'), sheetEl = $('.sheet');
  // Al tocar una pestaña se queda marcada esa sección hasta que la persona vuelva a desplazarse
  let lockId = null;
  // Cada navegación tiene su turno: correcciones pendientes de un toque anterior ya no mueven la página
  let navToken = 0;
  const unlock = () => { lockId = null; navToken++; };
  ['wheel', 'touchstart', 'keydown'].forEach(t => addEventListener(t, e => {
    if (e.target && e.target.closest && e.target.closest('.chips')) return;
    unlock();
  }, { passive: true }));
  // Sección activa: la última cuyo inicio ya pasó por debajo de la barra (medido en pantalla, no con offsetTop)
  const activeId = () => {
    const lim = navEl.getBoundingClientRect().bottom + 24;
    let id = null;
    secs.forEach(s => { if (s && s.getBoundingClientRect().top <= lim) id = s.id; });
    if (scrollY >= document.documentElement.scrollHeight - innerHeight - 2) {
      // hasta abajo: la última sección que se alcanza a ver
      secs.forEach(s => { if (s && s.getBoundingClientRect().top < innerHeight * 0.5) id = s.id; });
    }
    return id;
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const id = lockId || activeId();
      if (id) setActive(id); else { current = null; chips.forEach(c => c.classList.toggle('on', false)); }
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      topBtn.classList.toggle('show', scrollY > innerHeight);
      const hh = heroEl.offsetHeight;
      heroEl.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / hh)).toFixed(3));
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // Transición de burbujas: suben, tapan la pantalla con el logo al centro, se salta y siguen subiendo
  const btr = $('.btr'), btBack = $('.bt-back'), btFront = $('.bt-front');
  const rnd = (a, b) => a + Math.random() * (b - a);
  const makeBubbles = (intro) => {
    const back = [], front = [];
    const W = innerWidth, cols = W < 600 ? 5 : 8, rows = W < 600 ? 8 : 7;
    const bub = (l, t, s, d, layer) => layer.push(`<span class="bub" style="--l:${l}%;--t:${t}%;--s:${s}px;--d:${d}ms;--dur:${Math.round(intro ? rnd(1250, 1550) : rnd(2050, 2350))}ms;--dx:${Math.round(rnd(-40, 40))}px"><i style="--w:${Math.round(rnd(380, 620))}ms"></i></span>`);
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const l = (k + rnd(.15, .85)) * 100 / cols, t = (r + rnd(.1, .9)) * 100 / rows;
      bub(l, t, Math.round(rnd(W < 600 ? 56 : 76, W < 600 ? 118 : 160)), Math.round(rnd(0, 200)), Math.random() < .55 ? back : front);
    }
    for (let i = 0; i < 28; i++) bub(rnd(2, 98), rnd(2, 98), Math.round(rnd(34, 58)), Math.round(rnd(0, 220)), Math.random() < .5 ? back : front);
    for (let i = 0; i < (intro ? 80 : 60); i++) bub(rnd(1, 99), rnd(1, 99), Math.round(rnd(8, 30)), Math.round(rnd(0, intro ? 380 : 300)), Math.random() < .5 ? back : front);
    btBack.innerHTML = back.join(''); btFront.innerHTML = front.join('');
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Enlaces compartidos con #seccion: se quita de la dirección para que al copiar/compartir quede limpia
  const cleanHash = () => { if (location.hash) history.replaceState(null, '', location.pathname + location.search); };
  const startHash = location.hash;
  cleanHash();
  if (startHash.length > 1) {
    const el = document.getElementById(decodeURIComponent(startHash.slice(1)));
    const go = () => { if (el) { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, targetY(el)); document.documentElement.style.scrollBehavior = ''; } };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(go));
  }
  let busy = false;
  const jumpTo = y => {
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); if (Math.abs(scrollY - y) <= 2) return; } catch (e) {}
    const html = document.documentElement;
    const prev = html.style.scrollBehavior; html.style.scrollBehavior = 'auto';
    window.scrollTo(0, y); html.style.scrollBehavior = prev;
  };
  // y puede ser un número o una función (se calcula justo al saltar); si hay elemento, se corrige si la página se acomodó
  const land = (y, el) => {
    jumpTo(typeof y === 'function' ? y() : y);
    if (!el) return;
    const my = navToken;
    const fix = () => { if (my !== navToken) return; const t = targetY(el); if (Math.abs(t - scrollY) > 2) jumpTo(t); };
    requestAnimationFrame(() => requestAnimationFrame(fix)); setTimeout(fix, 400);
  };
  const goTo = (y, viaCurtain, el) => {
    if (reduce || !viaCurtain) { land(y, el); return; }
    if (busy) return; busy = true;
    btr.classList.toggle('intro', false);
    makeBubbles();
    btr.classList.toggle('go', false); void btr.offsetWidth;
    btr.classList.toggle('go', true);
    const t0 = performance.now();
    const dest = () => (typeof y === 'function' ? y() : y);
    const anims = () => (document.getAnimations ? document.getAnimations().filter(a => { const t = a.effect && a.effect.target; return t && t.closest && t.closest('.btr'); }) : []);
    let held = false, pauseAt = 0, pausedFor = 0;
    const finish = () => { clearTimeout(safety); anims().forEach(a => a.play()); btr.classList.toggle('go', false); btBack.innerHTML = btFront.innerHTML = ''; busy = false; };
    const safety = setTimeout(finish, 5200);   // pase lo que pase, nunca se queda tapada la página
    // tapada la pantalla (0.7 s): salta, y sigue corrigiendo hasta que la posición se quede quieta
    setTimeout(() => {
      land(y, el);
      let last = -1, still = 0;
      const watch = () => {
        const t = performance.now() - t0, want = el ? targetY(el) : dest();
        if (Math.abs(scrollY - want) > 2) jumpTo(want);
        still = Math.abs(scrollY - last) < 1 && Math.abs(scrollY - want) <= 2 ? still + 1 : 0;
        last = scrollY;
        const settled = still >= 6 && t > 1650;
        // si a punto de destapar todavía no está quieto, se detiene la animación hasta que lo esté (máx. 1.5 s más)
        if (!settled && t > 1700 && !held && t < 3100) { held = true; pauseAt = performance.now(); anims().forEach(a => a.pause()); }
        if (settled || t > 3100) {
          if (held) { held = false; pausedFor += performance.now() - pauseAt; anims().forEach(a => a.play()); }
          const left = Math.max(0, 2400 + pausedFor - (performance.now() - t0));
          setTimeout(finish, left + 450);
          return;
        }
        setTimeout(watch, 30);
      };
      setTimeout(watch, 30);
    }, 720);
  };
  const targetY = el => el.getBoundingClientRect().top + window.scrollY - (el.id === 'inicio' ? 0 : navEl.offsetHeight - 4);
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', e => {
    const id = link.getAttribute('href'); const el = id.length > 1 && $(id);
    if (!el) return;
    e.preventDefault();
    if (busy) return;
    navToken++;
    lockId = secs.includes(el) ? el.id : null;
    if (lockId) setActive(lockId);
    const y = targetY(el);
    const heroH = heroEl.offsetHeight;
    const crossesHero = window.scrollY < heroH - 60 || y < heroH - 60;
    const far = crossesHero || Math.abs(y - window.scrollY) > innerHeight * 1.2;
    if (far) goTo(() => targetY(el), true, el); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }));
  topBtn.addEventListener('click', () => { if (busy) return; lockId = null; navToken++; goTo(0, window.scrollY > innerHeight * 1.2); });

  if (btr.classList.contains('intro')) {
    if (!reduce && performance.now() < 1000) makeBubbles(true);
    setTimeout(() => { btr.classList.toggle('intro', false); if (!busy) btBack.innerHTML = btFront.innerHTML = ''; }, 2100);
  }
})();
