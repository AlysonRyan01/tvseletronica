/* ================================================================
   TVS Eletrônica — Main JS v2
   ================================================================ */

/* ---- Mobile Navigation ---- */
(function () {
  const btn      = document.getElementById('hamburger');
  const drawer   = document.getElementById('mobile-drawer');
  const close    = document.getElementById('drawer-close');
  const backdrop = document.getElementById('drawer-back');
  if (!btn || !drawer) return;

  const open  = () => { drawer.classList.add('open'); btn.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const shut  = () => { drawer.classList.remove('open'); btn.classList.remove('open'); document.body.style.overflow = ''; };

  btn.addEventListener('click', open);
  close?.addEventListener('click', shut);
  backdrop?.addEventListener('click', shut);
  drawer.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', shut));
})();

/* ---- Active nav ---- */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .drawer-link').forEach(el => {
    const href = (el.getAttribute('href') || '').split('/').pop();
    if (href === path) el.classList.add('active');
  });
})();

/* ---- Scroll reveal ---- */
(function () {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const d = Number(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('on'), d);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
})();

/* ---- Counter animation ---- */
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = parseInt(el.dataset.duration || 1600, 10);
  const suffix   = el.dataset.suffix || '';
  const prefix   = el.dataset.prefix || '';
  const start    = performance.now();
  const run = now => {
    const p = Math.min((now - start) / duration, 1);
    const v = Math.floor((1 - Math.pow(1 - p, 3)) * target);
    el.textContent = prefix + v.toLocaleString('pt-BR') + suffix;
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

(function () {
  const els = document.querySelectorAll('[data-counter]');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(e.target); io.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
})();

/* ---- Toast ---- */
const Toast = {
  _wrap() {
    let w = document.getElementById('toast-container');
    if (!w) { w = document.createElement('div'); w.id = 'toast-container'; w.className = 'toast-wrap'; document.body.appendChild(w); }
    return w;
  },
  show(msg, type = 'inf', ms = 4000) {
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    this._wrap().appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(110%)'; t.style.transition='all .3s ease'; setTimeout(()=>t.remove(),300); }, ms);
  },
  success: (m,d)=>Toast.show(m,'ok',d),
  error:   (m,d)=>Toast.show(m,'err',d),
  info:    (m,d)=>Toast.show(m,'inf',d),
};
window.Toast = Toast;

/* ---- Cooldown timer ---- */
function startCooldown(btn, minutes = 2) {
  btn.disabled = true;
  let rem = minutes * 60;
  const orig = btn.dataset.originalText || btn.textContent;
  btn.dataset.originalText = orig;
  const tick = () => {
    const m = String(Math.floor(rem/60)).padStart(2,'0');
    const s = String(rem%60).padStart(2,'0');
    btn.textContent = `AGUARDE ${m}:${s}`;
    rem--;
    if (rem < 0) { clearInterval(t); btn.disabled = false; btn.textContent = orig; }
  };
  tick();
  const t = setInterval(tick, 1000);
}
window.startCooldown = startCooldown;

/* ---- File upload UI ---- */
function initFileUpload(inputId, listId) {
  const inp = document.getElementById(inputId);
  const lst = document.getElementById(listId);
  if (!inp || !lst) return;
  inp.addEventListener('change', () => {
    lst.innerHTML = '';
    Array.from(inp.files).forEach(f => {
      const d = document.createElement('div');
      d.className = 'upload-file';
      d.textContent = f.name;
      lst.appendChild(d);
    });
  });
}
window.initFileUpload = initFileUpload;

/* ---- Modal ---- */
const Modal = {
  show(id) { const el=document.getElementById(id); if(el) el.style.display='flex'; },
  hide(id) { const el=document.getElementById(id); if(el) el.style.display='none'; },
};
window.Modal = Modal;
