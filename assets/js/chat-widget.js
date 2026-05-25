// Chat Widget — بوت سياسات منصة المقاول (policy-chat endpoint, no auth required)
(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    .elm-chat-widget {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 9999;
      font-family: 'Alexandria', 'Tajawal', sans-serif;
      direction: rtl;
    }
    .elm-chat-toggle {
      width: 58px; height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0F172A, #1E3A8A);
      color: white; border: none;
      box-shadow: 0 6px 20px rgba(15,23,42,0.35);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
    }
    .elm-chat-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 28px rgba(15,23,42,0.45);
    }
    .elm-chat-toggle svg { width: 26px; height: 26px; fill: white; }
    .elm-badge {
      position: absolute;
      top: -4px; right: -4px;
      background: #F59E0B;
      color: #0F172A;
      font-size: 10px; font-weight: 800;
      width: 18px; height: 18px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white;
      animation: badgePulse 2s ease-in-out infinite;
    }
    @keyframes badgePulse {
      0%,100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
    .elm-chat-box {
      position: absolute;
      bottom: 72px; left: 0;
      width: 360px; height: 520px;
      max-height: 80vh;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(15,23,42,0.22);
      display: none; flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(15,23,42,0.08);
      transform: translateY(8px) scale(0.97);
      opacity: 0;
      transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1);
    }
    .elm-chat-box.open {
      display: flex;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .elm-chat-header {
      background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%);
      color: white; padding: 16px 18px;
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .elm-chat-header-info { display: flex; align-items: center; gap: 10px; }
    .elm-chat-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(245,158,11,0.2);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .elm-chat-avatar svg { width: 20px; height: 20px; fill: #F59E0B; }
    .elm-chat-name { font-size: 14px; font-weight: 800; }
    .elm-chat-status { font-size: 11px; color: #22D3EE; display: flex; align-items: center; gap: 4px; }
    .elm-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22D3EE; animation: pulseDot 2s ease-in-out infinite; }
    @keyframes pulseDot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    .elm-chat-close {
      background: rgba(255,255,255,0.1); border: none; color: white;
      width: 30px; height: 30px; border-radius: 50%;
      cursor: pointer; font-size: 18px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .elm-chat-close:hover { background: rgba(255,255,255,0.2); }
    .elm-chat-messages {
      flex: 1; padding: 16px; overflow-y: auto;
      background: #F8FAFC;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    .elm-chat-messages::-webkit-scrollbar { width: 4px; }
    .elm-chat-messages::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
    .elm-msg {
      max-width: 88%; padding: 10px 14px;
      border-radius: 14px; font-size: 13.5px;
      line-height: 1.65; word-break: break-word;
    }
    .elm-msg-user {
      align-self: flex-start;
      background: #1E3A8A; color: #fff;
      border-bottom-right-radius: 4px;
    }
    .elm-msg-bot {
      align-self: flex-end;
      background: #fff; color: #0F172A;
      border: 1px solid rgba(15,23,42,0.08);
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 6px rgba(15,23,42,0.05);
    }
    .elm-msg-bot .elm-policy-tags {
      margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px;
    }
    .elm-policy-tag {
      font-size: 10px; font-weight: 700;
      background: rgba(245,158,11,0.12); color: #92400E;
      padding: 2px 8px; border-radius: 99px;
    }
    .elm-typing {
      display: flex; align-items: center; gap: 4px; padding: 12px 14px;
      background: #fff; border: 1px solid rgba(15,23,42,0.08);
      border-radius: 14px; border-bottom-left-radius: 4px;
      align-self: flex-end; box-shadow: 0 2px 6px rgba(15,23,42,0.05);
    }
    .elm-typing span {
      width: 7px; height: 7px; background: #94A3B8; border-radius: 50%;
      animation: elmBounce 1.3s ease-in-out infinite both;
    }
    .elm-typing span:nth-child(1) { animation-delay: 0s; }
    .elm-typing span:nth-child(2) { animation-delay: 0.18s; }
    .elm-typing span:nth-child(3) { animation-delay: 0.36s; }
    @keyframes elmBounce {
      0%,80%,100% { transform: scale(0.7); opacity:0.4; }
      40% { transform: scale(1); opacity:1; }
    }
    .elm-chat-input-area {
      padding: 14px 16px; background: #fff;
      border-top: 1px solid rgba(15,23,42,0.07);
      display: flex; gap: 10px; align-items: center; flex-shrink: 0;
    }
    .elm-chat-input {
      flex: 1; padding: 10px 14px;
      border: 1px solid rgba(15,23,42,0.12); border-radius: 99px;
      outline: none; font-family: inherit; font-size: 13px;
      color: #0F172A; background: #F8FAFC;
      transition: border-color 0.2s;
    }
    .elm-chat-input:focus { border-color: #3B82F6; background: #fff; }
    .elm-chat-send {
      background: linear-gradient(135deg, #0F172A, #1E3A8A);
      color: white; border: none;
      width: 38px; height: 38px; border-radius: 50%;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s, transform 0.2s;
    }
    .elm-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .elm-chat-send:not(:disabled):hover { transform: scale(1.08); }
    .elm-chat-send svg { width: 16px; height: 16px; fill: white; }
    .elm-quick-questions {
      padding: 0 16px 12px;
      display: flex; flex-direction: column; gap: 6px;
      border-top: 1px solid rgba(15,23,42,0.05); background: #fff;
    }
    .elm-quick-label { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .elm-quick-btn {
      font-size: 12px; color: #1E3A8A; background: rgba(30,58,138,0.06);
      border: 1px solid rgba(30,58,138,0.12); border-radius: 99px;
      padding: 6px 12px; cursor: pointer; text-align: right;
      font-family: inherit; transition: background 0.18s;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .elm-quick-btn:hover { background: rgba(30,58,138,0.12); }
    @media (max-width: 400px) { .elm-chat-box { width: 300px; } }
  `;
  document.head.appendChild(style);

  // Widget HTML
  const widget = document.createElement('div');
  widget.className = 'elm-chat-widget';
  widget.innerHTML = `
    <div class="elm-chat-box" id="elm-chat-box">
      <div class="elm-chat-header">
        <div class="elm-chat-header-info">
          <div class="elm-chat-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7H3a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2M5 19a2 2 0 002 2h10a2 2 0 002-2v-1H5v1M3 14v3h18v-3H3z"/></svg>
          </div>
          <div>
            <div class="elm-chat-name">مساعد المقاول الذكي</div>
            <div class="elm-chat-status"><span class="elm-status-dot"></span> متاح الآن</div>
          </div>
        </div>
        <button class="elm-chat-close" id="elm-chat-close">&times;</button>
      </div>
      <div class="elm-chat-messages" id="elm-chat-messages">
        <div class="elm-msg elm-msg-bot">أهلاً! أنا مساعد منصة المقاول. يمكنني الإجابة على أسئلتك حول سياسات المنصة، نظام الضمان، العقود، والدفع. كيف يمكنني مساعدتك؟ 🏗️</div>
      </div>
      <div class="elm-quick-questions" id="elm-quick-questions">
        <div class="elm-quick-label">ردود سريعة — اضغط للحصول على إجابة فورية</div>
        <button class="elm-quick-btn" data-quick-key="add_project">كيف أضيف مشروع؟</button>
        <button class="elm-quick-btn" data-quick-key="payment">طريقة الدفع</button>
        <button class="elm-quick-btn" data-quick-key="warranty">شروط الضمان</button>
        <button class="elm-quick-btn" data-quick-key="commission">العمولة كام؟</button>
        <button class="elm-quick-btn" data-quick-key="contract_sign">كيف أوقع العقد؟</button>
      </div>
      <form class="elm-chat-input-area" id="elm-chat-form">
        <input type="text" class="elm-chat-input" id="elm-chat-input" placeholder="اكتب سؤالك هنا..." autocomplete="off" maxlength="500">
        <button type="submit" class="elm-chat-send" id="elm-chat-send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </button>
      </form>
    </div>
    <button class="elm-chat-toggle" id="elm-chat-toggle">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <span class="elm-badge">AI</span>
    </button>
  `;
  document.body.appendChild(widget);

  const toggleBtn = document.getElementById('elm-chat-toggle');
  const closeBtn = document.getElementById('elm-chat-close');
  const chatBox = document.getElementById('elm-chat-box');
  const chatForm = document.getElementById('elm-chat-form');
  const input = document.getElementById('elm-chat-input');
  const messagesDiv = document.getElementById('elm-chat-messages');
  const sendBtn = document.getElementById('elm-chat-send');
  const quickDiv = document.getElementById('elm-quick-questions');

  const API_BASE = window.ELM_API_BASE ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:4000'
      : '');
  let isOpen = false;

  // toggle open/close with animation
  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      chatBox.style.display = 'flex';
      requestAnimationFrame(() => chatBox.classList.add('open'));
    } else {
      chatBox.classList.remove('open');
      setTimeout(() => { chatBox.style.display = 'none'; }, 230);
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    chatBox.classList.remove('open');
    setTimeout(() => { chatBox.style.display = 'none'; }, 230);
  });

  // Hardcoded quick replies — instant responses, no API call needed
  const QUICK_REPLIES = {
    add_project: 'لإضافة مشروع جديد: سجّل دخولك كعميل ← اضغط "نشر مشروع جديد" في لوحة التحكم ← أدخل وصف المشروع والميزانية والموقع ← انشره ليصلك عروض المقاولين فوراً. يمكنك استخدام مساعد الذكاء الاصطناعي لتحسين وصف مشروعك تلقائياً.',
    payment: 'الدفع يتم عبر نظام الضمان الآمن: تودع قيمة المشروع في حساب ضمان محمي ← يُطلق المبلغ للمقاول فقط بعد موافقتك على اكتمال كل مرحلة. المنصة تخصم 2% عمولة من المشاريع المكتملة، والتسجيل مجاني تماماً.',
    warranty: 'المنصة توفر ضماناً يصل إلى 10% من قيمة المشروع (بحد أقصى 50,000 جنيه) في حالة إخلال المقاول بالعقد. في حالة نزاع، تتدخل إدارة المنصة وتصدر حكماً ملزماً خلال 5 أيام عمل.',
    commission: 'العمولة 2% فقط من قيمة المشروع، وتُخصم عند إتمام الصفقة. لا رسوم تسجيل ولا رسوم نشر مشاريع — العملاء يستخدمون المنصة مجاناً تماماً.',
    contract_sign: 'توقيع العقد يتم إلكترونياً: بعد قبول عرض المقاول، اذهب إلى "اتفاقياتي" ← اضغط "توقيع العقد" ← ارسم توقيعك أو ارفع صورته. عند توقيع الطرفين، يصبح العقد نافذاً ويبدأ نظام الضمان. العقود موثقة بتوقيع رقمي قانوني.',
  };

  // quick question buttons
  quickDiv.querySelectorAll('.elm-quick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.quickKey;
      const question = btn.textContent.trim();
      addMsg(question, 'user');
      quickDiv.style.display = 'none';
      if (key && QUICK_REPLIES[key]) {
        // Instant hardcoded reply — no API call
        setTimeout(() => addMsg(QUICK_REPLIES[key], 'bot'), 300);
      } else {
        input.value = question;
        sendMessage(question);
      }
    });
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    quickDiv.style.display = 'none';
    sendMessage(text);
  });

  async function sendMessage(text) {
    addMsg(text, 'user');
    input.value = '';
    sendBtn.disabled = true;

    const typingEl = addTyping();

    try {
      const token = localStorage.getItem('elm_accessToken') || localStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/ai/policy-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: text }),
      });

      typingEl.remove();

      if (res.ok) {
        const data = await res.json();
        addMsg(data.answer, 'bot', data.relatedPolicies);
      } else if (res.status === 429) {
        addMsg('وصلت للحد الأقصى من الأسئلة (٢٠ سؤال/ساعة). حاول مرة أخرى بعد قليل.', 'bot');
      } else {
        addMsg('عذراً، حدث خطأ أثناء معالجة سؤالك. حاول مرة أخرى.', 'bot');
      }
    } catch {
      typingEl.remove();
      addMsg('تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.', 'bot');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  const POLICY_LABELS = {
    escrow: 'الضمان', commission: 'العمولة', contracts: 'العقود',
    warranty: 'الضمان', dispute: 'النزاعات', contractors: 'المقاولون',
    credits: 'النقاط', subscriptions: 'الاشتراكات', privacy: 'الخصوصية', refund: 'الاسترداد',
  };

  function addMsg(text, sender, relatedPolicies = []) {
    const div = document.createElement('div');
    div.className = `elm-msg elm-msg-${sender}`;
    div.textContent = text;

    if (sender === 'bot' && relatedPolicies && relatedPolicies.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'elm-policy-tags';
      relatedPolicies.forEach((key) => {
        const tag = document.createElement('span');
        tag.className = 'elm-policy-tag';
        tag.textContent = POLICY_LABELS[key] || key;
        tagsDiv.appendChild(tag);
      });
      div.appendChild(tagsDiv);
    }

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return div;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'elm-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return div;
  }
})();
