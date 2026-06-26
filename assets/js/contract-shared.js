/* contract-shared.js — منطق مشترك لعرض العقود والتوقيع */
(function (global) {
  const PROJECT_TYPE_LABELS = {
    new_construction: 'بناء جديد',
    finishing: 'تشطيبات',
    renovation: 'تجديد وترميم',
    repair: 'إصلاح وصيانة',
    extension: 'توسعة',
    demolition: 'هدم',
    electrical: 'أعمال كهربائية',
    plumbing: 'أعمال سباكة',
    other: 'أخرى',
  };

  const SPECIALTY_LABELS = {
    civil_engineer: 'مهندس مدني',
    architect: 'مهندس معماري',
    electrical: 'فني كهرباء',
    plumber: 'سباك',
    carpenter: 'نجار',
    painter: 'نقاش',
    general_contractor: 'مقاول عام',
    finishing: 'تشطيبات',
    other: 'أخرى',
  };

  function apiBase() {
    if (global.api && global.api.API_URL) return global.api.API_URL;
    const host = global.location.hostname;
    return host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:4000/api'
      : '/api';
  }

  function uploadsBase() {
    const host = global.location.hostname;
    return host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:4000'
      : '';
  }

  function fmtMoney(n) {
    return Number(n || 0).toLocaleString('ar-EG') + ' ج.م';
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /** حالة العقد من منظور الطرف الحالي */
  function getSigningState(contract, role) {
    const custSigned = !!contract.customerSignature?.signed;
    const contrSigned = !!contract.contractorSignature?.signed;
    const isActive = contract.status === 'active';

    if (isActive) {
      return {
        badge: 'اتفاق مفعل ✅',
        badgeStyle: 'background:var(--color-success-bg);color:var(--color-success);',
        message: 'تم توقيع العقد من الطرفين وهو ساري الآن.',
        canSign: false,
        step: 4,
      };
    }

    if (role === 'customer') {
      if (!custSigned) {
        return {
          badge: 'بانتظار توقيعك ✍️',
          badgeStyle: 'background:#fef3c7;color:#d97706;',
          message: 'راجع بنود العقد ثم وقّع إلكترونياً لتفعيل الاتفاق.',
          canSign: true,
          step: custSigned ? 3 : 2,
        };
      }
      return {
        badge: contrSigned ? 'جاري التفعيل...' : 'بانتظار توقيع المقاول ⏳',
        badgeStyle: 'background:#dbeafe;color:#1d4ed8;',
        message: contrSigned ? 'اكتملت التوقيعات.' : 'وقّعت أنت. بانتظار توقيع المقاول/المهندس.',
        canSign: false,
        step: 3,
      };
    }

    // contractor
    if (!contract._id && !contract.pdfFilename) {
      return {
        badge: 'بانتظار توليد العقد ⏳',
        badgeStyle: 'background:#fef3c7;color:#d97706;',
        message: 'في انتظار أن ينشئ العميل العقد الإلكتروني.',
        canSign: false,
        step: 1,
      };
    }

    if (!contrSigned) {
      return {
        badge: 'بانتظار توقيعك ✍️',
        badgeStyle: 'background:#fef3c7;color:#d97706;',
        message: 'راجع بنود العقد ثم وقّع إلكترونياً.',
        canSign: true,
        step: custSigned ? 3 : 2,
      };
    }

    return {
      badge: custSigned ? 'جاري التفعيل...' : 'بانتظار توقيع العميل ⏳',
      badgeStyle: 'background:#dbeafe;color:#1d4ed8;',
      message: custSigned ? 'اكتملت التوقيعات.' : 'وقّعت أنت. بانتظار توقيع العميل.',
      canSign: false,
      step: 3,
    };
  }

  function renderSignStepper(contract) {
    const cust = !!contract.customerSignature?.signed;
    const contr = !!contract.contractorSignature?.signed;
    const active = contract.status === 'active';
    const steps = [
      { label: 'توليد العقد', done: true },
      { label: 'توقيع العميل', done: cust },
      { label: 'توقيع المقاول', done: contr },
      { label: 'اتفاق مفعل', done: active },
    ];
    return `<div class="contract-stepper">${steps.map((s, i) => `
      <div class="c-step ${s.done ? 'done' : ''} ${!s.done && (i === 0 || steps[i - 1].done) ? 'current' : ''}">
        <div class="c-step-dot">${s.done ? '✓' : i + 1}</div>
        <div class="c-step-lbl">${s.label}</div>
      </div>`).join('')}</div>`;
  }

  function renderSignatureBox(label, sig, signedAt) {
    const imgUrl = sig?.signatureImageUrl
      ? uploadsBase() + sig.signatureImageUrl
      : (sig?.signatureImage ? uploadsBase() + '/uploads/signatures/' + sig.signatureImage : null);
    if (sig?.signed) {
      return `
        <div class="sig-box signed">
          <div class="sig-box-lbl">${label}</div>
          ${imgUrl ? `<img src="${imgUrl}" alt="توقيع" class="sig-box-img">` : '<div class="sig-box-placeholder">✓ موقّع رقمياً</div>'}
          <div class="sig-box-date">${fmtDate(signedAt)}</div>
        </div>`;
    }
    return `
      <div class="sig-box pending">
        <div class="sig-box-lbl">${label}</div>
        <div class="sig-box-placeholder">بانتظار التوقيع...</div>
      </div>`;
  }

  function renderContractDocument(contract) {
    const bid = Number(contract.bidAmount || 0);
    const commission = Math.round(bid * (contract.commissionRate || 0.02));
    const net = bid - commission;
    const m1 = Math.round(net * 0.30);
    const m2 = Math.round(net * 0.40);
    const m3 = net - m1 - m2;
    const gov = contract.propertyDetails?.governorate || '—';
    const area = contract.propertyDetails?.area ? contract.propertyDetails.area + ' م²' : '—';
    const pType = PROJECT_TYPE_LABELS[contract.projectType] || contract.projectType || '—';
    const spec = SPECIALTY_LABELS[contract.contractor?.specialty] || contract.contractor?.specialty || '—';

    return `
      <div class="contract-doc">
        <div class="contract-doc-header">
          <h3>عقد تنفيذ أعمال — منصة المقاول</h3>
          <p>رقم العقد: #${(contract._id || '').toString().slice(-8).toUpperCase()} · ${fmtDate(contract.generatedAt)}</p>
        </div>

        <section class="contract-doc-section">
          <h4>الطرفان</h4>
          <div class="contract-doc-parties">
            <div><strong>الطرف الأول (العميل):</strong> ${contract.customer?.name || '—'}</div>
            <div><strong>الطرف الثاني (المقاول):</strong> ${contract.contractor?.name || '—'} — ${spec}</div>
          </div>
        </section>

        <section class="contract-doc-section">
          <h4>تفاصيل المشروع</h4>
          <ul class="contract-doc-list">
            <li><span>عنوان المشروع</span><strong>${contract.projectTitle || '—'}</strong></li>
            <li><span>نوع الأعمال</span><strong>${pType}</strong></li>
            <li><span>الموقع</span><strong>${gov}</strong></li>
            <li><span>المساحة</span><strong>${area}</strong></li>
            <li><span>مدة التنفيذ</span><strong>${contract.proposedDuration ? contract.proposedDuration + ' يوم' : '—'}</strong></li>
          </ul>
        </section>

        <section class="contract-doc-section">
          <h4>الشروط المالية</h4>
          <ul class="contract-doc-list">
            <li><span>قيمة التعاقد</span><strong>${fmtMoney(bid)}</strong></li>
            <li><span>عمولة المنصة (${((contract.commissionRate || 0.02) * 100).toFixed(1)}%)</span><strong>${fmtMoney(commission)}</strong></li>
            <li><span>صافي مستحق المقاول</span><strong>${fmtMoney(net)}</strong></li>
            <li><span>سقف الضمان</span><strong>${fmtMoney(contract.warrantyCapEGP)}</strong></li>
          </ul>
          <p class="contract-doc-note">جدول الدفعات: 30% عند البدء (${fmtMoney(m1)}) — 40% عند منتصف التنفيذ (${fmtMoney(m2)}) — 30% عند التسليم (${fmtMoney(m3)}).</p>
        </section>

        <section class="contract-doc-section">
          <h4>بنود عامة</h4>
          <p class="contract-doc-terms">
            يلتزم الطرف الثاني بتنفيذ الأعمال المتفق عليها وفق المواصفات المعتمدة والجدول الزمني.
            يتم الاحتفاظ بمبلغ الضمان عبر نظام Escrow لحماية الطرفين.
            أي نزاع يُحال لإدارة المنصة للفصل وفق شروط الاستخدام المعتمدة.
          </p>
        </section>

        <section class="contract-doc-section">
          <h4>التوقيعات</h4>
          <div class="contract-sigs-grid">
            ${renderSignatureBox('توقيع العميل', contract.customerSignature, contract.customerSignature?.signedAt)}
            ${renderSignatureBox('توقيع المقاول', contract.contractorSignature, contract.contractorSignature?.signedAt)}
          </div>
        </section>
      </div>`;
  }

  // ── E-Signature Modal (shared) ──
  let _signContractId = null;
  let _signMode = 'draw';
  let _isDrawing = false;
  let _ctx = null;
  let _onSigned = null;

  function ensureSignModal() {
    if (document.getElementById('elmSignModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="elmSignModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);align-items:center;justify-content:center;">
        <div style="background:var(--bg-surface);border-radius:var(--radius-lg);padding:var(--space-8);max-width:520px;width:95%;box-shadow:var(--shadow-xl);position:relative;border:1px solid var(--border-default);">
          <button type="button" id="elmSignClose" style="position:absolute;top:12px;left:12px;background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-muted);">✕</button>
          <h3 style="font-size:var(--font-size-lg);font-weight:900;color:var(--color-navy);margin-bottom:var(--space-2);">التوقيع الإلكتروني</h3>
          <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:var(--space-6);">ارسم توقيعك أو ارفع صورة بعد مراجعة العقد.</p>
          <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4);">
            <button type="button" id="elmTabDraw" class="btn btn-primary btn-sm" style="flex:1;">✏️ رسم</button>
            <button type="button" id="elmTabUpload" class="btn btn-outline btn-sm" style="flex:1;">📷 رفع صورة</button>
          </div>
          <div id="elmDrawSection">
            <canvas id="elmSignCanvas" width="460" height="180" style="width:100%;border:2px dashed var(--border-default);border-radius:var(--radius-sm);background:#fafafa;cursor:crosshair;touch-action:none;"></canvas>
            <button type="button" id="elmClearCanvas" style="margin-top:var(--space-2);background:none;border:none;color:var(--text-muted);font-size:12px;cursor:pointer;font-family:inherit;">🗑️ مسح</button>
          </div>
          <div id="elmUploadSection" style="display:none;">
            <label style="display:flex;flex-direction:column;align-items:center;padding:var(--space-8);border:2px dashed var(--border-default);border-radius:var(--radius-sm);cursor:pointer;background:#fafafa;">
              <span style="font-size:36px;margin-bottom:var(--space-2);">📁</span>
              <span style="font-size:var(--font-size-sm);color:var(--text-muted);">اختر صورة التوقيع</span>
              <input type="file" id="elmSignFile" accept="image/*" style="display:none;">
            </label>
            <img id="elmSigPreview" src="" alt="" style="display:none;max-width:100%;max-height:160px;margin-top:var(--space-3);border-radius:var(--radius-sm);border:1px solid var(--border-default);">
          </div>
          <button type="button" id="elmSubmitSign" class="btn btn-primary btn-full" style="margin-top:var(--space-5);font-weight:800;">✅ تأكيد التوقيع</button>
        </div>
      </div>`);

    document.getElementById('elmSignClose').onclick = closeSignModal;
    document.getElementById('elmTabDraw').onclick = () => switchSignTab('draw');
    document.getElementById('elmTabUpload').onclick = () => switchSignTab('upload');
    document.getElementById('elmClearCanvas').onclick = clearCanvas;
    document.getElementById('elmSignFile').onchange = (e) => previewUploadedSig(e.target);
    document.getElementById('elmSubmitSign').onclick = submitSignature;
    document.getElementById('elmSignModal').onclick = (e) => {
      if (e.target.id === 'elmSignModal') closeSignModal();
    };
  }

  function openSignModal(contractId, onSigned) {
    if (!contractId) return;
    ensureSignModal();
    _signContractId = contractId;
    _onSigned = onSigned || null;
    const modal = document.getElementById('elmSignModal');
    modal.style.display = 'flex';
    switchSignTab('draw');
    initCanvas();
  }

  function closeSignModal() {
    const m = document.getElementById('elmSignModal');
    if (m) m.style.display = 'none';
    _signContractId = null;
  }

  function switchSignTab(mode) {
    _signMode = mode;
    document.getElementById('elmDrawSection').style.display = mode === 'draw' ? 'block' : 'none';
    document.getElementById('elmUploadSection').style.display = mode === 'upload' ? 'block' : 'none';
    document.getElementById('elmTabDraw').className = mode === 'draw' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
    document.getElementById('elmTabUpload').className = mode === 'upload' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
    if (mode === 'draw') initCanvas();
  }

  function initCanvas() {
    const canvas = document.getElementById('elmSignCanvas');
    if (!canvas) return;
    _ctx = canvas.getContext('2d');
    _ctx.lineWidth = 2.5;
    _ctx.lineCap = 'round';
    _ctx.strokeStyle = '#0F172A';
    canvas.onmousedown = (e) => { _isDrawing = true; _ctx.beginPath(); _ctx.moveTo(e.offsetX, e.offsetY); };
    canvas.onmousemove = (e) => { if (!_isDrawing) return; _ctx.lineTo(e.offsetX, e.offsetY); _ctx.stroke(); };
    canvas.onmouseup = () => { _isDrawing = false; };
    canvas.onmouseleave = () => { _isDrawing = false; };
    canvas.ontouchstart = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      _isDrawing = true; _ctx.beginPath(); _ctx.moveTo(t.clientX - rect.left, t.clientY - rect.top);
    };
    canvas.ontouchmove = (e) => {
      e.preventDefault();
      if (!_isDrawing) return;
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      _ctx.lineTo(t.clientX - rect.left, t.clientY - rect.top); _ctx.stroke();
    };
    canvas.ontouchend = () => { _isDrawing = false; };
  }

  function clearCanvas() {
    const canvas = document.getElementById('elmSignCanvas');
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  function previewUploadedSig(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('elmSigPreview');
      img.src = e.target.result;
      img.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  async function submitSignature() {
    if (!_signContractId) return;
    let signatureData = '';
    if (_signMode === 'draw') {
      const canvas = document.getElementById('elmSignCanvas');
      const blank = document.createElement('canvas');
      blank.width = canvas.width; blank.height = canvas.height;
      if (canvas.toDataURL() === blank.toDataURL()) {
        throw new Error('يرجى رسم توقيعك أولاً');
      }
      signatureData = canvas.toDataURL('image/png');
    } else {
      const img = document.getElementById('elmSigPreview');
      if (!img.src || img.style.display === 'none') throw new Error('يرجى رفع صورة التوقيع');
      signatureData = img.src;
    }

    const btn = document.getElementById('elmSubmitSign');
    btn.disabled = true;
    btn.textContent = '⏳ جاري الإرسال...';
    try {
      const token = localStorage.getItem('elm_accessToken');
      const res = await fetch(`${apiBase()}/contracts/${_signContractId}/sign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureData }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'تعذّر تسجيل التوقيع');
      closeSignModal();
      if (_onSigned) _onSigned(data.contract);
      else global.location.reload();
    } catch (err) {
      alert(err.message || 'تعذّر تسجيل التوقيع');
    } finally {
      btn.disabled = false;
      btn.textContent = '✅ تأكيد التوقيع';
    }
  }

  async function downloadContractPdf(contractId) {
    const token = localStorage.getItem('elm_accessToken');
    const res = await fetch(`${apiBase()}/contracts/${contractId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('تعذّر تحميل ملف PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    global.open(url, '_blank');
  }

  global.ContractShared = {
    PROJECT_TYPE_LABELS,
    SPECIALTY_LABELS,
    apiBase,
    fmtMoney,
    fmtDate,
    getSigningState,
    renderSignStepper,
    renderSignatureBox,
    renderContractDocument,
    openSignModal,
    closeSignModal,
    downloadContractPdf,
  };
})(window);
