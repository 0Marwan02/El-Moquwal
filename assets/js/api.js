/* ============================================================
   api.js — Centralized API Communication
   - أصل السيرفر قابل للتهيئة عبر window.__API_BASE__ (origin بدون /api)
   - file:// أو live-server محلي → localhost:4000
   - أي استضافة تانية (الباك اند بيقدّم الواجهة) → نفس الـ origin
   ============================================================ */
const API_ORIGIN = (window.__API_BASE__ || '').replace(/\/api\/?$/, '').replace(/\/$/, '') ||
  (window.location.protocol === 'file:' ||
   window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : window.location.origin);
const API_URL = `${API_ORIGIN}/api`;

function loginRedirectHref() {
  const p = (window.location.pathname || '').replace(/\\/g, '/');
  if (p.includes('/dashboard/')) {
    return new URL('../../auth/login.html', window.location.href).href;
  }
  return new URL('auth/login.html', window.location.href).href;
}

window.api = {
  API_URL,
  API_ORIGIN,

  /** رابط ملف مرفوع على السيرفر (مستندات المقاولين، عقود PDF، ...) */
  fileUrl(filename) {
    return `${API_ORIGIN}/uploads/${filename}`;
  },

  async fetch(url, options = {}) {
    const token = localStorage.getItem('elm_accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers
      });
      
      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('elm_accessToken');
        localStorage.removeItem('elm_user');
        window.location.href = loginRedirectHref();
        throw new Error('جلسة العمل انتهت، الرجاء تسجيل الدخول مجدداً.');
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'حدث خطأ في الاتصال بالسيرفر');
      }
      return data;
    } catch (err) {
      console.error('API Call Failed:', err);
      throw err;
    }
  },

  /** رفع multipart — لا يضبط Content-Type ليترك للمتصفح boundary */
  async upload(url, formData) {
    const token = localStorage.getItem('elm_accessToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      localStorage.removeItem('elm_accessToken');
      localStorage.removeItem('elm_user');
      window.location.href = loginRedirectHref();
      throw new Error('جلسة العمل انتهت، الرجاء تسجيل الدخول مجدداً.');
    }

    if (!res.ok) {
      throw new Error(data.message || data.error || 'فشل رفع الملفات');
    }
    return data;
  },

  auth: {
    login(credentials) { 
      return api.fetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); 
    },
    register(userData) { 
      return api.fetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }); 
    },
    getMe() { 
      return api.fetch('/auth/me'); 
    }
  }
};
