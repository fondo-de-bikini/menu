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
  const heroEl = $('.hero'), navEl = $('.nav'), sheetEl = $('.sheet');
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
      const hh = heroEl.offsetHeight;
      heroEl.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / hh)).toFixed(3));
      const st = navEl.getBoundingClientRect().top <= 0.5; navEl.classList.toggle('stuck', st); sheetEl.classList.toggle('stuck', st);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // Transición de cortina: tapa, salta y descubre (nunca se ve el recorrido por la portada)
  const curtain = $('.curtain');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy = false;
  const jumpTo = y => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior; html.style.scrollBehavior = 'auto';
    window.scrollTo(0, y); html.style.scrollBehavior = prev;
  };
  const goTo = (y, viaCurtain) => {
    if (reduce || !viaCurtain) { jumpTo(y); return; }
    if (busy) return; busy = true;
    curtain.classList.toggle('reveal-out', false); void curtain.offsetWidth;
    curtain.classList.toggle('cover', true);
    setTimeout(() => {
      jumpTo(y);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        curtain.classList.toggle('cover', false); curtain.classList.toggle('reveal-out', true);
        setTimeout(() => { curtain.classList.toggle('reveal-out', false); busy = false; }, 650);
      }));
    }, 620);
  };
  const targetY = el => el.getBoundingClientRect().top + window.scrollY - (el.id === 'inicio' ? 0 : 58);
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', e => {
    const id = link.getAttribute('href'); const el = id.length > 1 && $(id);
    if (!el) return;
    e.preventDefault();
    const y = targetY(el);
    const heroH = document.querySelector(".hero").offsetHeight;
    const crossesHero = window.scrollY < heroH - 60 || y < heroH - 60;
    const far = crossesHero || Math.abs(y - window.scrollY) > innerHeight * 1.2;
    if (far) goTo(y, true); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  }));
  topBtn.addEventListener('click', () => goTo(0, window.scrollY > innerHeight * 1.2));

  // Música: canción del menú en bucle continuo (11.2 s → 74.6 s), con entrada y salida suaves
  const music = $('.music');
  const audio = $('#bgm');
  const SRC = 'audio/musica.mp3';
  const START = 3.0, LOOP_START = 11.2, LOOP_END = 74.60626, VOL = 0.42;
  let ctx = null, gain = null, source = null, buffer = null, loading = false, playing = false;
  fetch(SRC, { method: 'HEAD' }).then(r => { if (r.ok) music.hidden = false; }).catch(() => {});

  const setState = on => {
    playing = on;
    music.classList.toggle('playing', on);
    music.setAttribute('aria-label', on ? 'Pausar música' : 'Reproducir música');
  };
  const fade = (to, secs) => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(to, t + secs);
  };
  async function startWebAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('sin Web Audio');
    if (!ctx) {
      ctx = new AC();
      gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') await ctx.resume();
    if (!buffer) {
      loading = true; music.classList.add('loading');
      const data = await (await fetch(SRC)).arrayBuffer();
      buffer = await new Promise((ok, bad) => ctx.decodeAudioData(data, ok, bad));
      loading = false; music.classList.remove('loading');
    }
    if (!source) {
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = LOOP_START;
      source.loopEnd = Math.min(LOOP_END, buffer.duration);
      source.connect(gain);
      source.start(0, START);
    }
    fade(VOL, 2.2);
    setState(true);
  }
  function pauseWebAudio() {
    setState(false);
    fade(0, 0.6);
    setTimeout(() => { if (!playing && ctx) ctx.suspend(); }, 650);
  }
  // Respaldo con <audio> si el navegador no soporta Web Audio
  function toggleFallback() {
    if (audio.paused) { audio.src = SRC; audio.volume = VOL; audio.play().then(() => setState(true)).catch(() => {}); }
    else { audio.pause(); setState(false); }
  }
  music.addEventListener('click', async () => {
    music.classList.add('seen');
    if (loading) return;
    try {
      if (playing) { pauseWebAudio(); try { sessionStorage.setItem('musicaOff', '1'); } catch (e) {} }
      else { try { sessionStorage.removeItem('musicaOff'); } catch (e) {} await startWebAudio(); }
    } catch (e) {
      loading = false; music.classList.remove('loading');
      toggleFallback();
    }
  });
  // Música automática: intenta sonar al abrir; si el navegador lo bloquea, empieza con el primer toque en la página
  const userOff = () => { try { return sessionStorage.getItem('musicaOff') === '1'; } catch (e) { return false; } };
  const autoStart = async ev => {
    if (ev && ev.target && ev.target.closest && ev.target.closest('.music')) return;
    if (playing || loading || userOff() || music.hidden) return;
    try { await startWebAudio(); music.classList.add('seen'); } catch (e) {}
    if (playing) ['pointerdown', 'touchend', 'click', 'keydown'].forEach(t => document.removeEventListener(t, autoStart, true));
  };
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(t => document.addEventListener(t, autoStart, true));
  fetch(SRC, { method: 'HEAD' }).then(r => {
    if (!r.ok || userOff()) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = ctx || new AC();
      if (!gain) { gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination); }
      ctx.resume().then(() => { if (ctx.state === 'running') autoStart(); }).catch(() => {});
    } catch (e) {}
  }).catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) { if (ctx) pauseWebAudio(); else { audio.pause(); setState(false); } }
  });
})();
