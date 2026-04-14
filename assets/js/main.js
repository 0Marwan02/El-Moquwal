/* ============================================================
   main.js — الـ JavaScript المشترك في كل الصفحات
   ============================================================ */

/* --- Navbar scroll effect --- */
(function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();


/* --- Scroll Reveal Animation --- */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();


/* --- Active Nav Link based on scroll --- */
(function initActiveNav() {
  const navLinks = document.querySelectorAll('.navbar-nav a[href^="#"]');
  if (!navLinks.length) return;

  const sections = [...navLinks].map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.navbar-nav a[href="#${entry.target.id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();


/* --- Sidebar Active Item --- */
(function initSidebarNav() {
  const items = document.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
})();


/* --- Toast Notification System --- */
window.Toast = {
  show(message, type = 'success', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toast.style.cssText = `
      position:fixed; bottom:24px; left:24px; z-index:9999;
      background:${type === 'success' ? '#2ECC71' : type === 'error' ? '#E74C3C' : '#1A2B4A'};
      color:#fff; padding:14px 20px; border-radius:10px;
      font-family:'Alexandria',sans-serif; font-weight:700; font-size:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.2);
      transform:translateY(100%); transition:transform 0.3s ease;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};