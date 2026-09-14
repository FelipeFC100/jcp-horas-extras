(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mqMobile = window.matchMedia("(max-width: 720px)");
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  /* ============ WhatsApp: uma mensagem por bloco ============ */
  const WA_NUMBER = "5561982533524";
  const waLink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

  const MSG = {
    header: "Olá! Vim pelo site de horas extras e queria falar sobre o meu caso.",
    hero: "Olá! Vim pelo site de horas extras e queria falar sobre o meu caso.",
    sinais: "Olá! Vi a lista no site de horas extras e algumas situações acontecem comigo. Queria entender melhor.",
    prova: "Olá! Li a parte sobre prova de jornada no site. Não sei se tenho prova e queria saber como funciona.",
    conta: "Olá! Fiz a conta das horas no site e queria entender o meu caso.",
    prazo: "Olá! Queria saber se ainda estou no prazo para cobrar horas extras.",
    "ainda-trabalho": "Olá! Ainda trabalho na empresa e queria entender minhas opções.",
    faq: "Olá! Li as perguntas frequentes no site de horas extras e fiquei com uma dúvida.",
    final: "Olá! Vim pelo site de horas extras e queria falar sobre o meu caso.",
    flutuante: "Olá! Vim pelo site de horas extras e queria falar com um advogado.",
    "barra-mobile": "Olá! Vim pelo site de horas extras e queria falar com um advogado.",
    rodape: "Olá! Vim pelo site de horas extras e queria falar com um advogado."
  };

  /* Eventos de conversão: cada botão registra de qual bloco a pessoa saiu.
     Funciona com Google Tag Manager (dataLayer), Meta Pixel (fbq) e Google Ads/GA4 (gtag) quando instalados. */
  const track = (event, bloco) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, bloco });
    if (typeof window.fbq === "function") window.fbq("trackCustom", event === "whatsapp_click" ? "WhatsAppClick" : "PhoneClick", { bloco });
    if (typeof window.gtag === "function") window.gtag("event", event, { bloco });
  };

  document.querySelectorAll("[data-wa]").forEach((a) => {
    if (MSG[a.dataset.wa]) a.href = waLink(MSG[a.dataset.wa]);
    // lido na hora do clique: a barra mobile troca de bloco conforme a rolagem
    a.addEventListener("click", () => track("whatsapp_click", a.dataset.wa));
  });
  document.querySelectorAll("[data-tel]").forEach((a) => {
    a.addEventListener("click", () => track("phone_click", a.dataset.tel));
  });

  /* ============ Header ============ */
  const header = document.getElementById("siteHeader");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    // no celular o header some ao rolar para baixo e volta ao rolar para cima
    if (!mqMobile.matches || y < 120) header.classList.remove("is-hidden");
    else if (Math.abs(y - lastY) > 6) header.classList.toggle("is-hidden", y > lastY);
    else return;
    lastY = y;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ============ Menu mobile ============ */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  const setNav = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    mobileNav.classList.toggle("is-open", open);
  };
  navToggle.addEventListener("click", () => setNav(navToggle.getAttribute("aria-expanded") !== "true"));
  mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

  /* ============ Visibilidade: botão do header, WhatsApp flutuante e barra mobile ============ */
  const heroActions = document.getElementById("heroActions");
  const finalCta = document.getElementById("contato");
  const footer = document.querySelector(".site-footer");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      header.classList.toggle("cta-live", past);
      document.body.classList.toggle("show-float", past);
    }).observe(heroActions);

    const endEls = new Set();
    const endIo = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? endEls.add(en.target) : endEls.delete(en.target)));
      document.body.classList.toggle("at-end", endEls.size > 0);
    }, { threshold: 0.25 });
    endIo.observe(finalCta);
    endIo.observe(footer);
  } else {
    header.classList.add("cta-live");
    document.body.classList.add("show-float");
  }

  /* ============ FAQ ============ */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    q.addEventListener("click", () => {
      const open = !item.classList.contains("is-open");
      item.classList.toggle("is-open", open);
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ============ Revelação ao rolar ============ */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ============ Inclinação 3D no hover (só mouse) ============ */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      let rect = null;
      const strong = el.matches(".hero-frame, .about-photo, .cta-frame, .timesheet");
      const strength = strong ? 7 : 5;
      const base = el.classList.contains("timesheet") ? " rotate(1.6deg)" : "";
      el.addEventListener("pointerenter", () => { rect = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) rotateY(${(px * strength).toFixed(2)}deg) translateY(-4px)${base}`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; rect = null; });
    });
  }

  /* a barra mobile se atualiza quando o contador muda (definida mais abaixo) */
  let refreshBar = () => {};

  /* ============ Bloco 04 — Contador de horas (tempo, nunca valores) ============ */
  const rH = document.getElementById("rangeHoras");
  const rA = document.getElementById("rangeAnos");
  const outH = document.getElementById("outHoras");
  const outA = document.getElementById("outAnos");
  const outTotal = document.getElementById("outTotal");
  const outDias = document.getElementById("outDias");
  const contaBtn = document.querySelector('[data-wa="conta"]');
  const DIAS_POR_ANO = 240; // 20 dias trabalhados por mês
  const fmtHoras = (v) => (v < 1 ? "30 min" : Number.isInteger(v) ? `${v}h` : `${Math.floor(v)}h30`);
  const nf = new Intl.NumberFormat("pt-BR");
  let shown = 720, tween = null, contaTotal = 720, contaMsg = MSG.conta;

  const animateTo = (target) => {
    if (reduceMotion) { outTotal.textContent = nf.format(target); shown = target; return; }
    cancelAnimationFrame(tween);
    const from = shown, t0 = performance.now(), dur = 420;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      shown = Math.round(from + (target - from) * e);
      outTotal.textContent = nf.format(shown);
      if (k < 1) tween = requestAnimationFrame(step);
    };
    tween = requestAnimationFrame(step);
  };
  const fill = (input) => {
    const p = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.setProperty("--p", p + "%");
  };
  const updateCounter = () => {
    const h = parseFloat(rH.value), a = parseInt(rA.value, 10);
    const total = Math.round(h * DIAS_POR_ANO * a);
    const dias = Math.round(total / 8);
    outH.textContent = fmtHoras(h);
    outA.textContent = a === 1 ? "1 ano" : `${a} anos`;
    outDias.textContent = `≈ ${nf.format(dias)} dias inteiros de trabalho de 8 horas`;
    animateTo(total);
    fill(rH); fill(rA);
    contaTotal = total;
    contaMsg = `Olá! Fiz a conta das horas no site: cerca de ${fmtHoras(h)} a mais por dia, durante ${outA.textContent}. Deu umas ${nf.format(total)} horas. Queria entender o meu caso.`;
    contaBtn.href = waLink(contaMsg);
    refreshBar();
  };
  [rH, rA].forEach((r) => r.addEventListener("input", updateCounter));
  updateCounter();

  /* ============ Barra fixa mobile: rótulo e mensagem do bloco que está na tela ============ */
  const bar = document.querySelector(".mb-wa");
  const barLabel = bar && bar.querySelector(".mb-label");
  if (bar && barLabel && "IntersectionObserver" in window) {
    const BAR = {
      sinais: () => ["Contar minha situação", MSG.sinais],
      prova: () => ["Perguntar sobre a prova", MSG.prova],
      conta: () => [`Mandar minhas ${nf.format(contaTotal)} horas`, contaMsg],
      prazo: () => ["Conferir meu prazo", MSG.prazo],
      faq: () => ["Tirar minha dúvida", MSG.faq]
    };
    let current = null;
    refreshBar = () => {
      const [label, msg] = current ? BAR[current]() : ["Falar com advogado", MSG["barra-mobile"]];
      barLabel.textContent = label;
      bar.href = waLink(msg);
      bar.dataset.wa = current ? `barra-${current}` : "barra-mobile";
    };
    // faixa fina no meio da tela: a seção que passa por ela é a "atual"
    const bandIo = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) current = BAR[en.target.id] ? en.target.id : null;
      });
      refreshBar();
    }, { rootMargin: "-50% 0px -50% 0px" });
    document.querySelectorAll("main > section[id]").forEach((s) => bandIo.observe(s));
  }

  /* ============ Hero — partículas douradas (canvas 2D leve) ============ */
  const canvas = document.getElementById("heroCanvas");
  // no celular e com economia de dados as partículas ficam desligadas (bateria e 4G fraco)
  if (canvas && !reduceMotion && !mqMobile.matches && !saveData && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.closest(".hero");
    let w = 0, h = 0, parts = [], raf = 0, running = false, lastW = 0;
    let mx = 0, my = 0, cx = 0, cy = 0;

    const build = () => {
      const n = window.innerWidth < 720 ? 26 : 64;
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2, r: Math.random() * 1.3 + 0.5,
        vx: (Math.random() - 0.5) * 0.08, vy: -(Math.random() * 0.14 + 0.04),
        a: Math.random() * 0.45 + 0.2, t: Math.random() * 6.28
      }));
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (Math.abs(w - lastW) > 40 || !parts.length) build();
      lastW = w;
    };
    const frame = () => {
      cx += (mx - cx) * 0.04; cy += (my - cy) * 0.04;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy * p.z; p.t += 0.02;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        const x = p.x + cx * 22 * p.z, y = p.y + cy * 14 * p.z;
        ctx.beginPath();
        ctx.arc(x, y, p.r * p.z + 0.3, 0, 6.283);
        ctx.fillStyle = `rgba(242,224,184,${(p.a * (0.65 + 0.35 * Math.sin(p.t))).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (finePointer) {
      window.addEventListener("pointermove", (e) => {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }
    let heroVisible = true;
    new IntersectionObserver(([en]) => {
      heroVisible = en.isIntersecting;
      heroVisible ? start() : stop();
    }).observe(hero);
    document.addEventListener("visibilitychange", () => (document.hidden || !heroVisible ? stop() : start()));
  } else if (canvas) {
    canvas.style.display = "none";
  }

  /* ============ Ano no rodapé ============ */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
