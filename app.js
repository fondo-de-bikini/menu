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
  const setActive = id => {
    if (id === current) return;
    current = id;
    chips.forEach(c => {
      const on = c.getAttribute('href') === '#' + id;
      c.classList.toggle('on', on);
      if (on) chipBox.scrollTo({ left: c.offsetLeft - chipBox.clientWidth / 2 + c.clientWidth / 2, behavior: 'smooth' });
    });
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY + 90;
      let id = null;
      secs.forEach(s => { if (s && s.offsetTop <= y) id = s.id; });
      if (id) setActive(id);
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
      topBtn.classList.toggle('show', scrollY > innerHeight);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  // Música: el botón aparece si existe audio/musica.mp3 (oficial) o audio/musica.wav (original)
  const music = $('.music');
  const audio = $('#bgm');
  const VOL = 0.45;
  (async () => {
    for (const src of ['audio/musica.mp3', 'audio/musica.wav']) {
      try { const r = await fetch(src, { method: 'HEAD' }); if (r.ok) { audio.src = src; music.hidden = false; return; } } catch (e) {}
    }
  })();
  let fadeTimer = null;
  const fadeTo = (target, ms, done) => {
    clearInterval(fadeTimer);
    const start = audio.volume, t0 = performance.now();
    fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      audio.volume = start + (target - start) * k;
      if (k >= 1) { clearInterval(fadeTimer); done && done(); }
    }, 40);
  };
  music.addEventListener('click', () => {
    music.classList.add('seen');
    if (audio.paused) {
      audio.volume = 0;
      audio.play().then(() => {
        music.classList.add('playing'); music.setAttribute('aria-label', 'Pausar música');
        fadeTo(VOL, 2000);
      }).catch(() => {});
    } else {
      music.classList.remove('playing'); music.setAttribute('aria-label', 'Reproducir música');
      fadeTo(0, 500, () => audio.pause());
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) { audio.pause(); music.classList.remove('playing'); }
  });
})();
