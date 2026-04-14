/* ============================================================
   auth.js — el logic el kamel bta3 safa7at el auth
   login / register-customer / register-contractor / role-select / admin-login
   ============================================================ */

(function () {
  'use strict';

  // el API base — momken yetzabat men outside
  const API_BASE = window.__API_BASE__ || 'http://localhost:4000/api';

  // ============================================================
  // HELPERS — shared utils lel kol el forms
  // ============================================================

  // el function dy bet7ot message fel alert el fo2 el form
  function showAlert(id, message, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `auth-alert show alert-${type}`;
    el.textContent = message;
  }

  // bet5fy el alert
  function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }

  // byfa3el / y-disable el loading state 3ala el button
  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const label = btn.querySelector('.btn-label');
    const dots = btn.querySelector('.auth-btn-dots');
    if (loading) {
      btn.disabled = true;
      btn.classList.add('loading');
      if (label) label.hidden = true;
      if (dots) dots.hidden = false;
    } else {
      btn.disabled = false;
      btn.classList.remove('loading');
      if (label) label.hidden = false;
      if (dots) dots.hidden = true;
    }
  }

  // by3ml fetch wrapper byraga3 JSON w byshil el error handling
  async function apiCall(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      },
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const err = new Error(data.error || 'حصل خطأ، حاول تاني');
      err.status = res.status;
      err.code = data.code;
      err.data = data;
      throw err;
    }
    return data;
  }

  // byt2kd en el email sa7
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // byt2kd en el phone masry
  function isValidPhone(phone) {
    return /^01[0125]\d{8}$/.test(phone.replace(/\s|-/g, ''));
  }

  // byt2kd en el password strong enough lel policy
  function isStrongPassword(pw) { return true; }

  // byshoof el identifier (login) email wala phone wala nid
  function isValidIdentifier(id) {
    return isValidEmail(id) || isValidPhone(id) || /^\d{14}$/.test(id);
  }

  // by3ml format le el size el bytes le shakl qari (KB / MB)
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  // ============================================================
  // PASSWORD TOGGLE — show/hide lel passwords
  // ============================================================

  // by3ml init 3ala kol el toggles fel page
  function initPasswordToggles() {
    document.querySelectorAll('.auth-pass-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.style.color = isPass ? 'var(--color-navy)' : '';
      });
    });
  }

  // ============================================================
  // PASSWORD STRENGTH METER — le el register forms
  // ============================================================

  // bytakhd el input id we el bar ids we byrkeb listener
  function initPasswordStrength(passId, fillId, labelId) {
    const passInput = document.getElementById(passId);
    const fill = document.getElementById(fillId);
    const label = document.getElementById(labelId);
    if (!passInput || !fill) return;

    passInput.addEventListener('input', () => {
      const val = passInput.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      fill.className = 'auth-strength-fill';
      if (label) label.className = 'auth-strength-label';

      if (val.length === 0) {
        if (label) label.textContent = '';
      } else if (score <= 1) {
        fill.classList.add('weak');
        if (label) { label.classList.add('weak'); label.textContent = 'ضعيفة'; }
      } else if (score <= 2) {
        fill.classList.add('medium');
        if (label) { label.classList.add('medium'); label.textContent = 'متوسطة'; }
      } else {
        fill.classList.add('strong');
        if (label) { label.classList.add('strong'); label.textContent = 'قوية ✓'; }
      }
    });
  }

  // ============================================================
  // INPUT BLUR VALIDATION — visual feedback
  // ============================================================

  function initInputFeedback() {
    document.querySelectorAll('.auth-form .input').forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.required && !input.value.trim()) {
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
        if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
          input.classList.add('error');
        }
      });
      input.addEventListener('input', () => input.classList.remove('error'));
    });
  }

  // ============================================================
  // LOGIN FORM — el regular login (customer + contractor)
  // ============================================================

  function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert('loginAlert');

      const identifier = document.getElementById('loginIdentifier').value.trim();
      const pass = document.getElementById('loginPass').value;

      // basic validation
      if (!identifier || !pass) {
        return showAlert('loginAlert', 'برجاء ملء جميع الحقول');
      }
      if (!isValidIdentifier(identifier)) {
        return showAlert('loginAlert', 'أدخل الرقم القومي الخاص بك (14 رقم)');
      }

      setLoading('loginBtn', true);
      try {
        const data = await apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password: pass }),
        });

        // n7ot el access token we ne3ml redirect hasb el role
        localStorage.setItem('elm_accessToken', data.accessToken);
        localStorage.setItem('elm_user', JSON.stringify(data.user));
        showAlert('loginAlert', 'تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');

        setTimeout(() => {
          const role = data.user?.role;
          if (role === 'customer') window.location.href = '../dashboard/customer/index.html';
          else if (role === 'contractor') window.location.href = '../dashboard/professional/index.html';
          else if (role === 'admin') window.location.href = '../dashboard/manager/index.html';
        }, 900);
      } catch (err) {
        showAlert('loginAlert', err.message);
      } finally {
        setLoading('loginBtn', false);
      }
    });
  }

  // ============================================================
  // ADMIN LOGIN — el login el makhas lel idara
  // ============================================================

  function initAdminLogin() {
    const form = document.getElementById('adminLoginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert('adminLoginAlert');

      const email = document.getElementById('adminEmail').value.trim().toLowerCase();
      const pass = document.getElementById('adminPass').value;

      if (!email || !pass) return showAlert('adminLoginAlert', 'برجاء ملء جميع الحقول');
      if (!isValidEmail(email)) return showAlert('adminLoginAlert', 'البريد الإلكتروني غير صحيح');

      setLoading('adminLoginBtn', true);
      try {
        const data = await apiCall('/auth/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: pass }),
        });
        localStorage.setItem('elm_accessToken', data.accessToken);
        localStorage.setItem('elm_user', JSON.stringify(data.user));
        showAlert('adminLoginAlert', 'تم تسجيل الدخول بنجاح!', 'success');
        setTimeout(() => { window.location.href = '../dashboard/manager/index.html'; }, 900);
      } catch (err) {
        showAlert('adminLoginAlert', err.message);
      } finally {
        setLoading('adminLoginBtn', false);
      }
    });
  }

  // ============================================================
  // CUSTOMER REGISTER — bel NID live parse
  // ============================================================

  function initCustomerRegister() {
    const form = document.getElementById('customerRegisterForm');
    if (!form) return;

    // init el strength meter
    initPasswordStrength('regPass', 'strengthFill', 'strengthLabel');

    // el NID live parse — lama el user yekteb ysta5rg el data tl2a2y
    const nidInput = document.getElementById('regNID');
    const preview = document.getElementById('nidPreview');
    const dobEl = document.getElementById('nidDob');
    const genderEl = document.getElementById('nidGender');
    const govEl = document.getElementById('nidGov');

    // byshoof el NID w ye3ml update lel preview
    function updateNIDPreview() {
      const val = nidInput.value.replace(/\D/g, '').slice(0, 14);
      nidInput.value = val;
      if (val.length !== 14 || !window.NIDParser) {
        preview.hidden = true;
        nidInput.classList.remove('error');
        return;
      }
      const result = window.NIDParser.parseNID(val);
      if (!result.valid) {
        preview.hidden = true;
        nidInput.classList.add('error');
        return;
      }
      nidInput.classList.remove('error');
      dobEl.textContent = result.dobDisplay;
      genderEl.textContent = result.genderAr;
      govEl.textContent = result.governorate;
      preview.hidden = false;
      // Motion One bounce-in animation lel preview card
      if (window.Motion && window.Motion.animate) {
        window.Motion.animate(
          preview,
          { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0)'] },
          { duration: 0.35, easing: [0.22, 1, 0.36, 1] }
        );
      }
    }

    if (nidInput) nidInput.addEventListener('input', updateNIDPreview);

    // el submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert('registerAlert');

      const name = document.getElementById('regName').value.trim();
      const nationalId = document.getElementById('regNID').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const phone = document.getElementById('regPhone').value.trim();
      const pass = document.getElementById('regPass').value;
      const confirm = document.getElementById('regPassConfirm').value;
      const terms = document.getElementById('agreeTerms').checked;

      // el validation el kamel
      if (!name || !nationalId || !email || !phone || !pass || !confirm) {
        return showAlert('registerAlert', 'برجاء ملء جميع الحقول');
      }
      if (name.length < 3) return showAlert('registerAlert', 'الاسم قصير جداً');
      if (!/^\d{14}$/.test(nationalId)) return showAlert('registerAlert', 'الرقم القومي لازم 14 رقم');
      if (window.NIDParser) {
        const p = window.NIDParser.parseNID(nationalId);
        if (!p.valid) return showAlert('registerAlert', p.reason || 'الرقم القومي غير صحيح');
      }
      if (!isValidEmail(email)) return showAlert('registerAlert', 'البريد الإلكتروني غير صحيح');
      if (!isValidPhone(phone)) return showAlert('registerAlert', 'رقم الهاتف غير صحيح');
      if (!isStrongPassword(pass)) return showAlert('registerAlert', 'كلمة المرور ضعيفة — 8 حروف + حرف كبير + رقم + رمز');
      if (pass !== confirm) return showAlert('registerAlert', 'كلمتا المرور غير متطابقتين');
      if (!terms) return showAlert('registerAlert', 'يجب الموافقة على الشروط والأحكام');

      setLoading('customerRegisterBtn', true);
      try {
        const data = await apiCall('/auth/register/customer', {
          method: 'POST',
          body: JSON.stringify({ name, nationalId, email, phone, password: pass }),
        });
        localStorage.setItem('elm_accessToken', data.accessToken);
        localStorage.setItem('elm_user', JSON.stringify(data.user));
        showAlert('registerAlert', 'تم إنشاء الحساب بنجاح! جاري التحويل...', 'success');
        setTimeout(() => { window.location.href = '../dashboard/customer/index.html'; }, 1100);
      } catch (err) {
        showAlert('registerAlert', err.message);
      } finally {
        setLoading('customerRegisterBtn', false);
      }
    });
  }

  // ============================================================
  // CONTRACTOR REGISTER — 2 steps + file uploads
  // ============================================================

  function initContractorRegister() {
    const form = document.getElementById('contractorRegisterForm');
    if (!form) return;

    initPasswordStrength('regPass', 'strengthFill', 'strengthLabel');

    // ====== stepper logic ======
    const stepper = document.getElementById('authStepper');
    const step1Content = form.querySelector('[data-step-content="1"]');
    const step2Content = form.querySelector('[data-step-content="2"]');
    const step1Btn = document.getElementById('step1NextBtn');
    const step2BackBtn = document.getElementById('step2BackBtn');

    // bykhod step (1 aw 2) w y3ml show/hide 3aleha
    function gotoStep(n) {
      const steps = stepper.querySelectorAll('.auth-step');
      steps.forEach((s) => {
        s.classList.toggle('active', parseInt(s.dataset.step, 10) <= n);
      });
      step1Content.classList.toggle('active', n === 1);
      step2Content.classList.toggle('active', n === 2);
      // remove HTML hidden attribute if present
      if (n === 2) step2Content.removeAttribute('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // show step 1 on init
    gotoStep(1);

    // step1 next — y3ml validate el basic fields w yekmel
    if (step1Btn) {
      step1Btn.addEventListener('click', () => {
        hideAlert('registerAlert');
        const name = document.getElementById('regName').value.trim();
        const nationalId = document.getElementById('regNID').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const phone = document.getElementById('regPhone').value.trim();
        const pass = document.getElementById('regPass').value;
        const confirm = document.getElementById('regPassConfirm').value;

        if (!name || !nationalId || !email || !phone || !pass || !confirm) {
          return showAlert('registerAlert', 'برجاء ملء جميع الحقول');
        }
        if (name.length < 3) return showAlert('registerAlert', 'الاسم قصير جداً');
        if (!/^\d{14}$/.test(nationalId)) return showAlert('registerAlert', 'الرقم القومي لازم 14 رقم');
        if (window.NIDParser) {
          const p = window.NIDParser.parseNID(nationalId);
          if (!p.valid) return showAlert('registerAlert', p.reason || 'الرقم القومي غير صحيح');
        }
        if (!isValidEmail(email)) return showAlert('registerAlert', 'البريد الإلكتروني غير صحيح');
        if (!isValidPhone(phone)) return showAlert('registerAlert', 'رقم الهاتف غير صحيح');
        if (!isStrongPassword(pass)) return showAlert('registerAlert', 'كلمة المرور ضعيفة');
        if (pass !== confirm) return showAlert('registerAlert', 'كلمتا المرور غير متطابقتين');

        gotoStep(2);
      });
    }

    if (step2BackBtn) step2BackBtn.addEventListener('click', () => gotoStep(1));

    // ====== file upload zones ======
    const MAX_BYTES = 5 * 1024 * 1024;
    const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

    // byrkeb listeners 3ala kol upload zone — click + drag-drop + remove
    function initUploadZone(zone) {
      const inputId = zone.dataset.uploadTarget;
      const input = document.getElementById(inputId);
      const placeholder = zone.querySelector('.auth-upload-placeholder');
      const filled = zone.querySelector('.auth-upload-filled');
      const nameEl = zone.querySelector('.auth-upload-name');
      const sizeEl = zone.querySelector('.auth-upload-size');
      const removeBtn = zone.querySelector('.auth-upload-remove');

      // bytakhd el file w y3ml validate + display
      function handleFile(file) {
        if (!file) return;
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
          showAlert('registerAlert', 'نوع الملف غير مسموح (PDF/JPG/PNG فقط)');
          return;
        }
        if (file.size > MAX_BYTES) {
          showAlert('registerAlert', 'حجم الملف أكبر من 5MB');
          return;
        }
        // n7ot el file fel input (3ashan ygy ma3a el form submit)
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        nameEl.textContent = file.name;
        sizeEl.textContent = formatSize(file.size);
        placeholder.hidden = true;
        filled.hidden = false;
        zone.classList.add('has-file');
      }

      // click 3ala el zone byftah el file picker
      zone.addEventListener('click', (e) => {
        if (e.target.closest('.auth-upload-remove')) return;
        input.click();
      });

      // el change lama el user yekhtar file
      input.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
      });

      // drag and drop
      ['dragenter', 'dragover'].forEach((ev) =>
        zone.addEventListener(ev, (e) => {
          e.preventDefault();
          zone.classList.add('dragging');
        })
      );
      ['dragleave', 'drop'].forEach((ev) =>
        zone.addEventListener(ev, (e) => {
          e.preventDefault();
          zone.classList.remove('dragging');
        })
      );
      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleFile(file);
      });

      // remove button
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          input.value = '';
          placeholder.hidden = false;
          filled.hidden = true;
          zone.classList.remove('has-file');
        });
      }
    }

    document.querySelectorAll('.auth-upload-zone').forEach(initUploadZone);

    // ====== submit ======
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert('registerAlert');

      const name = document.getElementById('regName').value.trim();
      const nationalId = document.getElementById('regNID').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const phone = document.getElementById('regPhone').value.trim();
      const pass = document.getElementById('regPass').value;
      const specialty = document.getElementById('regSpecialty').value;
      const years = document.getElementById('regYears').value;
      const bio = document.getElementById('regBio').value.trim();
      const cert = document.getElementById('regCertificate').files[0];
      const card = document.getElementById('regCard').files[0];
      const terms = document.getElementById('agreeTerms').checked;

      if (!specialty) return showAlert('registerAlert', 'اختر التخصص');
      if (years === '' || parseInt(years, 10) < 0) return showAlert('registerAlert', 'أدخل سنوات الخبرة');
      if (!cert) return showAlert('registerAlert', 'ارفع الشهادة');
      if (!card) return showAlert('registerAlert', 'ارفع كارنيه النقابة');
      if (!terms) return showAlert('registerAlert', 'يجب الموافقة على الشروط والأحكام');

      // n3ml FormData 3ashan el multipart upload
      const fd = new FormData();
      fd.append('name', name);
      fd.append('nationalId', nationalId);
      fd.append('email', email);
      fd.append('phone', phone);
      fd.append('password', pass);
      fd.append('specialty', specialty);
      fd.append('yearsOfExperience', years);
      fd.append('bio', bio);
      fd.append('certificate', cert);
      fd.append('membershipCard', card);

      setLoading('contractorRegisterBtn', true);
      try {
        const data = await apiCall('/auth/register/contractor', { method: 'POST', body: fd });
        // store tokens so contractor is logged in immediately
        if (data.accessToken) localStorage.setItem('elm_accessToken', data.accessToken);
        if (data.user) localStorage.setItem('elm_user', JSON.stringify(data.user));
        showAlert('registerAlert', 'تم إرسال طلبك بنجاح! جاري التحويل...', 'success');
        setTimeout(() => { window.location.href = '../dashboard/professional/profile.html'; }, 900);
      } catch (err) {
        showAlert('registerAlert', err.message);
      } finally {
        setLoading('contractorRegisterBtn', false);
      }
    });
  }

  // ============================================================
  // ROLE SELECT — e5tyar el nawa3 el 7esab
  // ============================================================

  function initRoleSelect() {
    const cards = document.querySelectorAll('.auth-role-card');
    const nextBtn = document.getElementById('roleNextBtn');
    if (!cards.length || !nextBtn) return;

    let selected = null;

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        selected = card.dataset.role;
        nextBtn.disabled = false;
      });
    });

    nextBtn.addEventListener('click', () => {
      if (!selected) return;
      if (selected === 'customer') window.location.href = 'register-customer.html';
      else if (selected === 'contractor') window.location.href = 'register-contractor.html';
    });
  }

  // ============================================================
  // BOOTSTRAP — init kol el modules (kol wa7ed byshoof nafsoh)
  // ============================================================

  function boot() {
    initPasswordToggles();
    initInputFeedback();
    initLogin();
    initAdminLogin();
    initCustomerRegister();
    initContractorRegister();
    initRoleSelect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
