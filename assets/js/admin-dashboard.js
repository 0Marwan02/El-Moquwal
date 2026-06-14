/* ============================================================
   admin-dashboard.js — لوحة الإدارة الموحّدة
   - مصدر واحد للـ Sidebar في كل صفحات الإدارة
   - يقرأ الصلاحيات الحيّة من /auth/me فأي تعديل يتفعّل فوراً
   - يخفي الأقسام غير المسموح بيها للأدمن المحدود
   ============================================================ */
(function () {
  // عناصر التنقّل — مصدر واحد للحقيقة. perm = الصلاحية المطلوبة (super_admin بيعدّي دايماً).
  // superOnly = للمدير الرئيسي فقط.
  const NAV = [
    { key: 'overview', href: 'index.html', label: 'لوحة التحكم',
      icon: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>' },
    { key: 'pending', href: 'pending-contractors.html', label: 'طلبات المقاولين', perm: 'review_contractors', badge: 'pending',
      icon: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>' },
    { key: 'projects', href: 'all-projects.html', label: 'كل المشاريع', perm: 'view_projects',
      icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>' },
    { key: 'disputes', href: 'disputes.html', label: 'النزاعات والشكاوى', perm: 'manage_disputes',
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>' },
    // ===== المدير الرئيسي فقط =====
    { key: 'reviewers', href: 'reviewers.html', label: 'إدارة المراجعين', superOnly: true, section: 'المدير الرئيسي',
      icon: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>' },
    { key: 'settings', href: 'settings.html', label: 'إعدادات المنصة', superOnly: true,
      icon: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' },
    { key: 'terms', href: 'terms.html', label: 'الشروط والأحكام', superOnly: true,
      icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { key: 'audit', href: 'audit-log.html', label: 'سجل العمليات', superOnly: true,
      icon: '<path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>' },
  ];

  function hasPerm(user, key) {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(key);
  }

  // يجيب المستخدم الحالي من السيرفر (صلاحيات محدّثة) ويخزّنه — مع fallback للكاش
  async function getFreshAdminUser() {
    let user = null;
    try {
      const res = await window.api.fetch('/auth/me');
      user = res.user || res;
      if (user) localStorage.setItem('elm_user', JSON.stringify(user));
    } catch (_) {
      try { user = JSON.parse(localStorage.getItem('elm_user') || 'null'); } catch (_) { user = null; }
    }
    return user;
  }

  // يبني الـ Sidebar حسب صلاحيات المستخدم والصفحة النشطة
  function renderSidebar(user, activeKey) {
    const aside = document.getElementById('adminSidebar');
    if (!aside) return;

    const isSuper = user && user.role === 'super_admin';
    const roleLabel = isSuper ? 'المدير الرئيسي' : 'مدير النظام';
    const initial = (user && user.name ? user.name : 'أ').charAt(0);

    let lastSection = null;
    const items = NAV
      .filter(item => {
        if (item.superOnly) return isSuper;
        if (item.perm) return hasPerm(user, item.perm);
        return true;
      })
      .map(item => {
        let sectionHtml = '';
        if (item.section && item.section !== lastSection) {
          lastSection = item.section;
          sectionHtml = `<div class="sidebar-section-label" style="margin-top:var(--space-4);">${item.section}</div>`;
        }
        const activeCls = item.key === activeKey ? ' active' : '';
        const superStyle = item.superOnly
          ? ' style="background:rgba(245,158,11,0.06);"' : '';
        const badge = item.badge
          ? `<span class="sidebar-badge" id="sidebarPendingCount">0</span>` : '';
        return `${sectionHtml}
        <a href="${item.href}" class="sidebar-item${activeCls}"${superStyle}>
          <svg viewBox="0 0 24 24">${item.icon}</svg>
          ${item.label}
          ${badge}
        </a>`;
      })
      .join('');

    aside.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo-mark"><img src="../../assets/images/logo.png" alt="المقاول"></div>
        <div class="sidebar-logo-text">المقاول</div>
      </div>
      <div class="sidebar-user">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;">${initial}</div>
        <div class="sidebar-user-info">
          <div class="name">${user && user.name ? user.name : 'مدير النظام'}</div>
          <div class="role" style="background:rgba(59,130,246,0.12);border-color:rgba(59,130,246,0.2);color:#93c5fd;">${roleLabel}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">الإدارة</div>
        ${items}
      </nav>
      <div class="sidebar-cta">
        <button class="btn btn-ghost-light btn-full" id="adminLogoutBtn">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.89 2 2 2h8v-2H4V5z"/></svg>
          تسجيل الخروج
        </button>
      </div>`;

    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('elm_accessToken');
        localStorage.removeItem('elm_user');
        window.location.href = '../../index.html';
      });
    }
  }

  // يحدّث عدّاد طلبات المقاولين في الـ Sidebar (endpoint خفيف بيرجّع العدد بس)
  async function updatePendingBadge() {
    const badge = document.getElementById('sidebarPendingCount');
    if (!badge) return;
    try {
      const res = await window.api.fetch('/admin/contractors/pending/count');
      badge.textContent = res.count || 0;
    } catch (_) { /* تجاهل */ }
  }

  /**
   * تهيئة صفحة إدارة: تتحقق من الدخول، تجيب الصلاحيات الحيّة، تبني الـ Sidebar، وتطبّق الحماية.
   * opts: { active, requirePerm, superOnly }
   * بترجّع المستخدم أو null (مع تحويل تلقائي لو مش مسموح).
   */
  async function bootAdminPage(opts = {}) {
    const token = localStorage.getItem('elm_accessToken');
    if (!token) { window.location.href = '../../auth/admin-login.html'; return null; }

    const user = await getFreshAdminUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      window.location.href = '../../auth/login.html';
      return null;
    }
    if (opts.superOnly && user.role !== 'super_admin') {
      window.location.href = 'index.html';
      return null;
    }
    if (opts.requirePerm && !hasPerm(user, opts.requirePerm)) {
      window.location.href = 'index.html';
      return null;
    }

    renderSidebar(user, opts.active);
    // الـ badge بيظهر بس لمن يملك صلاحية مراجعة المقاولين — نتجنب 403 مضمون
    if (hasPerm(user, 'review_contractors')) updatePendingBadge();
    return user;
  }

  window.adminDash = { hasPerm, getFreshAdminUser, renderSidebar, updatePendingBadge, bootAdminPage };
})();
