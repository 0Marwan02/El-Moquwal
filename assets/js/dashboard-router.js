/* ============================================================
   dashboard-router.js — SPA Client-side Router
   Professional Dashboard — El-Moquwal Platform

   Intercepts sidebar nav clicks, fetches destination HTML,
   swaps only the <main> content — sidebar stays fixed & static.
   History API keeps back/forward working normally.
   ============================================================ */

(function initSPARouter() {

  // ── Guard: only run inside professional dashboard pages ──
  if (!window.location.pathname.includes('/professional/')) return;

  // ─────────────────────────────────────────────────────────
  // Loader bar — thin gold progress bar at top of viewport
  // ─────────────────────────────────────────────────────────
  function showLoader() {
    let bar = document.getElementById('__spa_loader__');
    if (bar) bar.remove();
    bar = document.createElement('div');
    bar.id = '__spa_loader__';
    bar.style.cssText = [
      'position:fixed;top:0;left:0;right:0;height:3px;z-index:99999;',
      'background:linear-gradient(90deg,var(--color-gold,#F59E0B),var(--color-gold-light,#FCD34D));',
      'width:0%;transition:width 0.35s ease;border-radius:0 3px 3px 0;',
      'box-shadow:0 0 8px rgba(245,158,11,0.6);',
    ].join('');
    document.body.appendChild(bar);
    requestAnimationFrame(() => { bar.style.width = '55%'; });
    return bar;
  }

  function finishLoader(bar) {
    if (!bar) return;
    bar.style.transition = 'width 0.2s ease, opacity 0.3s ease 0.2s';
    bar.style.width = '100%';
    setTimeout(() => { bar.style.opacity = '0'; }, 200);
    setTimeout(() => { bar.remove(); }, 500);
  }

  // ─────────────────────────────────────────────────────────
  // Execute inline <script> from fetched page.
  // Patches document.addEventListener so DOMContentLoaded
  // callbacks fire immediately (DOM is already ready for SPAs).
  // ─────────────────────────────────────────────────────────
  function executeInlineScript(code) {
    if (!code || !code.trim()) return;

    // Save original and patch
    const origAddEvt = Document.prototype.addEventListener;
    Document.prototype.addEventListener = function(type, fn, ...rest) {
      if (type === 'DOMContentLoaded') {
        // Fire immediately — DOM is already loaded during SPA navigation
        try { fn.call(document); } catch (e) {
          console.error('[SPA Router] DOMContentLoaded handler error:', e);
        }
        return;
      }
      return origAddEvt.call(this, type, fn, ...rest);
    };

    try {
      const tag = document.createElement('script');
      tag.textContent = code;
      document.head.appendChild(tag);
      tag.remove();
    } catch (e) {
      console.error('[SPA Router] Script execution error:', e);
    } finally {
      // Restore
      Document.prototype.addEventListener = origAddEvt;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Update the active .sidebar-item based on target filename
  // ─────────────────────────────────────────────────────────
  function syncSidebarActive(href) {
    const target = href.split('/').pop().split('?')[0];
    document.querySelectorAll('a.sidebar-item').forEach(link => {
      const linkFile = (link.getAttribute('href') || '').split('/').pop().split('?')[0];
      link.classList.toggle('active', linkFile === target);
    });
  }

  // ─────────────────────────────────────────────────────────
  // Core navigation
  // ─────────────────────────────────────────────────────────
  async function navigateTo(url, pushState = true) {
    const bar = showLoader();
    const main = document.querySelector('main.dashboard-main');
    if (!main) { window.location.href = url; return; }

    try {
      // Fetch the destination page
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Parse
      const parser = new DOMParser();
      const fetched = parser.parseFromString(html, 'text/html');
      const newMain = fetched.querySelector('main.dashboard-main');
      if (!newMain) throw new Error('No <main class="dashboard-main"> found in fetched page');

      // ── Fade out ──
      main.style.cssText += 'opacity:0;transform:translateY(6px);transition:opacity 0.15s ease,transform 0.15s ease;';
      await new Promise(r => setTimeout(r, 150));

      // ── Swap content ──
      main.innerHTML = newMain.innerHTML;

      // Sync page-specific styles in <head>
      // Only remove styles we previously injected (marked with data-spa-style)
      // This preserves dynamically-injected widget CSS (e.g. chat-widget)
      document.querySelectorAll('head style[data-spa-style]').forEach(s => s.remove());
      fetched.head.querySelectorAll('style').forEach(s => {
        const clone = s.cloneNode(true);
        clone.setAttribute('data-spa-style', 'true');
        document.head.appendChild(clone);
      });

      // Sync specific outer elements (Modals, Toasts)
      ['.toast-stack', '.modal-overlay', '#signModal', '#paymentModal'].forEach(selector => {
        const oldEl = document.querySelector(selector);
        const newEl = fetched.body.querySelector(selector);
        if (oldEl && newEl) {
          oldEl.outerHTML = newEl.outerHTML;
        } else if (newEl && !oldEl) {
          document.body.appendChild(newEl.cloneNode(true));
        } else if (oldEl && !newEl) {
          oldEl.remove();
        }
      });

      // Scroll main + window back to top
      main.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'instant' });

      // ── Page title ──
      const newTitle = fetched.title;
      if (newTitle) document.title = newTitle;

      // ── History API ──
      if (pushState) {
        history.pushState({ url }, newTitle, url);
      }

      // ── Sidebar active state ──
      syncSidebarActive(url);

      // ── Execute page-specific inline scripts ──
      // We only re-run inline scripts (no src) from fetched body
      fetched.body.querySelectorAll('script:not([src])').forEach(s => {
        executeInlineScript(s.textContent);
      });

      // ── Fade in ──
      requestAnimationFrame(() => {
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
        setTimeout(() => {
          main.style.cssText = main.style.cssText
            .replace(/opacity:[^;]+;/g, '')
            .replace(/transform:[^;]+;/g, '')
            .replace(/transition:[^;]+;/g, '');
        }, 300);
      });

    } catch (err) {
      console.error('[SPA Router] Navigation error, falling back:', err);
      window.location.href = url; // graceful fallback
    } finally {
      finishLoader(bar);
    }
  }

  // ─────────────────────────────────────────────────────────
  // Event: Click on sidebar item links
  // ─────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    // Must be (or be inside) a sidebar-item anchor
    const link = e.target.closest('a.sidebar-item');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip external, hash, or non-HTML links
    if (
      href.startsWith('http') ||
      href.startsWith('//') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      !href.endsWith('.html')
    ) return;

    // Resolve to absolute URL
    let resolved;
    try { resolved = new URL(href, window.location.href).href; }
    catch { return; }

    // Same-origin only
    if (new URL(resolved).origin !== window.location.origin) return;

    // Don't reload current page
    if (resolved === window.location.href) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    navigateTo(resolved);
  });

  // ─────────────────────────────────────────────────────────
  // Event: Browser back / forward
  // ─────────────────────────────────────────────────────────
  window.addEventListener('popstate', function (e) {
    const url = (e.state && e.state.url) || window.location.href;
    navigateTo(url, false);
  });

  // ─────────────────────────────────────────────────────────
  // Seed initial history state so popstate works from page 1
  // ─────────────────────────────────────────────────────────
  history.replaceState(
    { url: window.location.href },
    document.title,
    window.location.href
  );

  // Mark existing page-specific <style> tags so the first SPA navigation
  // can properly remove them (widget-injected styles have no data-spa-style)
  document.querySelectorAll('head style:not([data-spa-style])').forEach(s => {
    // Only mark styles that look page-specific (not injected by widgets)
    // Widget styles are appended AFTER this router initializes
    s.setAttribute('data-spa-style', 'true');
  });

  console.log('[SPA Router] Initialized for professional dashboard ✓');

})();
