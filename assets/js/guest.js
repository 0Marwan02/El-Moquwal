/* ============================================================
   guest.js — el guest identity + scroll-triggered auth prompt
   kol el safa7at el 3ama bte7mel el file da 3ashan el user
   yetba3 be-guestId w lama yoosal le nos el page bl scroll
   yetla3lo modal y2olo sagel 7esab.
   ============================================================ */

(function () {
  'use strict';

  // el keys el byt7ot feha el data fel storage
  const GUEST_ID_KEY = 'elm_guestId';
  const DISMISS_KEY = 'elm_guestDismissedAt';
  // el dismiss baya3ed el modal y-show tany ba3d 10 d2aye2
  const DISMISS_TIMEOUT_MS = 10 * 60 * 1000;
  // el scroll percentage elly fawko neshawel el modal
  const TRIGGER_PERCENT = 0.5;

  // law el user da3m login fa mafesh lazma lel modal
  const authToken = localStorage.getItem('elm_accessToken');
  if (authToken) return;

  // ============================================================
  // 1) GUEST ID — n3ml aw nstkhrg wa7ed
  // ============================================================

  // el function dy bt3ml generate le UUID v4 bedoon mktba
  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // byshoof el guestId mawgoud fel localStorage wala la2
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  // el API base — momken yetzabat men window.__API_BASE__ lel configuration
  const API_BASE = window.__API_BASE__ || 'http://localhost:4000/api';

  // by-register el guest fel backend (fire-and-forget, ma n2fesh el page law fashal)
  (function pingGuest() {
    try {
      fetch(`${API_BASE}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ guestId }),
      }).catch(() => {});
    } catch (_) {}
  })();

  // ============================================================
  // 2) MODAL MARKUP — n3ml el DOM 3ala el fly (ma ne7tagsh HTML)
  // ============================================================

  // el function dy bte3ml inject lel modal fel DOM awel ma el page tet7amel
  function createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'auth-scroll-prompt';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'guestPromptTitle');
    overlay.innerHTML = `
      <div class="auth-scroll-prompt-card">
        <button type="button" class="auth-scroll-prompt-close" aria-label="إغلاق">×</button>
        <div class="auth-scroll-prompt-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
            <path d="M19 8v6M22 11h-6" />
          </svg>
        </div>
        <h3 id="guestPromptTitle">كمّل تصفحك وابني مشروعك 🏗️</h3>
        <p>سجّل حسابك دلوقتي في دقيقة واحدة عشان تقدر ترفع مشاريعك، تستقبل عروض أسعار، وتتابع كل حاجة في مكان واحد.</p>
        <div class="auth-scroll-prompt-actions">
          <a class="btn btn-primary btn-lg" href="/auth/role-select.html">أنشئ حسابًا جديدًا</a>
          <a class="btn btn-outline btn-lg" href="/auth/login.html">عندي حساب بالفعل</a>
        </div>
        <button type="button" class="auth-scroll-prompt-later">أكمل التصفح الآن</button>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  // ============================================================
  // 3) SHOW / HIDE LOGIC
  // ============================================================

  // byshoof law el user kan 2afel el modal men 2olayel
  function wasRecentlyDismissed() {
    const last = parseInt(sessionStorage.getItem(DISMISS_KEY) || '0', 10);
    if (!last) return false;
    return Date.now() - last < DISMISS_TIMEOUT_MS;
  }

  // byms7 el dismiss timestamp we yes7ab el modal
  function dismissModal(modal) {
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
    modal.classList.remove('visible');
    document.body.style.overflow = '';
  }

  // byzhar el modal bl animation
  function showModal(modal) {
    if (modal.classList.contains('visible')) return;
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
    // Motion One ba2y 3ala el CDN law mawgoud ne3mlo animate ashra
    if (window.Motion && window.Motion.animate) {
      window.Motion.animate(
        modal.querySelector('.auth-scroll-prompt-card'),
        { transform: ['translateY(40px) scale(0.96)', 'translateY(0) scale(1)'], opacity: [0, 1] },
        { duration: 0.45, easing: [0.22, 1, 0.36, 1] }
      );
    }
  }

  // ============================================================
  // 4) INIT — lama el DOM yebka ready
  // ============================================================

  function init() {
    if (wasRecentlyDismissed()) return;

    const modal = createModal();

    // el close button w el later button w el backdrop kolohom by2flo el modal
    modal.querySelector('.auth-scroll-prompt-close').addEventListener('click', () => dismissModal(modal));
    modal.querySelector('.auth-scroll-prompt-later').addEventListener('click', () => dismissModal(modal));
    modal.addEventListener('click', (e) => { if (e.target === modal) dismissModal(modal); });

    // ESC key by2fel el modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('visible')) dismissModal(modal);
    });

    // el scroll listener — byshoof kam el user sa7ab men el page
    let shown = false;
    function onScroll() {
      if (shown) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= TRIGGER_PERCENT) {
        shown = true;
        showModal(modal);
        window.removeEventListener('scroll', onScroll);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
