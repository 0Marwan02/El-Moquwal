// ============================================================
// pdfGenerator.js — Arabic Legal PDF Contract Generator
// El-Moquwal Platform — Phase 2 Upgrade
//
// Uses Puppeteer to render the Arabic HTML template to a
// flawless, RTL PDF with proper Arabic text shaping.
// Complies with Egyptian civil/construction law (Law 131/1948)
// ============================================================

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');
const env       = require('../config/env');
const logger    = require('./logger');

// ── Contracts output directory ───────────────────────────────
const CONTRACTS_DIR = path.join(env.UPLOADS_DIR, 'contracts');
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

// ── Logo path (bundled as base64 for Puppeteer file: protocol) ─
const LOGO_PATH = path.resolve(__dirname, '../../../../assets/images/logo.png');

// ── Arabic project type labels ───────────────────────────────
const PROJECT_TYPE_LABELS = {
  new_construction: 'بناء جديد',
  finishing:        'تشطيبات',
  renovation:       'تجديد وترميم',
  repair:           'إصلاح وصيانة',
  extension:        'توسعة وإضافة',
  demolition:       'هدم',
  electrical:       'أعمال كهربائية',
  plumbing:         'أعمال سباكة',
  other:            'أخرى',
};

// ── Status labels + CSS classes (Arabic) ────────────────────
const STATUS_MAP = {
  active:              { label: 'ساري وفعّال',         cls: 'active'    },
  pending_signatures:  { label: 'في انتظار التوقيع',   cls: 'pending'   },
  completed:           { label: 'مكتمل ومُسلَّم',       cls: 'completed' },
  disputed:            { label: 'متنازع عليه',          cls: 'disputed'  },
  draft:               { label: 'مسودة',                cls: 'pending'   },
};

// ── Formatted amounts (Arabic‐friendly) ─────────────────────
function fmt(num) {
  if (!num && num !== 0) return 'غير محدد';
  return Number(num).toLocaleString('ar-EG') + ' ج.م';
}

// ── Safe string ──────────────────────────────────────────────
function safe(val, fallback = 'غير محدد') {
  return (val && String(val).trim()) ? String(val).trim() : fallback;
}

// ── Build signature HTML block ───────────────────────────────
function buildSigBlock(sigData) {
  if (sigData && sigData.signed) {
    return `
      <div class="sig-signed">
        <div class="check">✓ تم التوقيع الرقمي بنجاح</div>
        <div class="hash">البصمة: ${(sigData.signatureHash || '').slice(0, 24)}…</div>
      </div>`;
  }
  return `<div class="sig-pending">في انتظار التوقيع...</div>`;
}

// ── Build logo tag (base64 inline or skip gracefully) ────────
function buildLogoTag() {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const b64 = fs.readFileSync(LOGO_PATH).toString('base64');
      const ext = path.extname(LOGO_PATH).slice(1).toLowerCase();
      const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      return `<img src="data:${mime};base64,${b64}" alt="المقاول" style="width:48px;height:48px;object-fit:contain;">`;
    }
  } catch (_) { /* logo missing — skip */ }
  // Fallback: text logo
  return `<span style="font-size:22pt;font-weight:900;color:var(--gold-light);">م</span>`;
}

/**
 * generatePDFContract
 * ──────────────────────────────────────────────────────────────
 * Renders the Arabic HTML template via Puppeteer and saves
 * the resulting A4 PDF to the contracts directory.
 *
 * @param  {Object}  contract  — Mongoose document (populated customer / contractor)
 * @returns {Promise<string>}  — filename (contract_<id>.pdf)
 */
async function generatePDFContract(contract) {
  const filename = `contract_${contract._id}.pdf`;
  const filePath = path.join(CONTRACTS_DIR, filename);

  // ── Read HTML template ──────────────────────────────────────
  const templatePath = path.resolve(__dirname, '../templates/contract-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // ── Extract party data ──────────────────────────────────────
  const customer   = contract.customer   || {};
  const contractor = contract.contractor || {};

  const customerName   = safe(customer.name,   'العميل');
  const customerEmail  = safe(customer.email,  '—');
  const customerPhone  = safe(customer.phone,  '—');
  const customerId     = safe(customer.nationalId || customer.idNumber, 'غير مُدرج');

  const contractorName      = safe(contractor.name,      'المقاول');
  const contractorEmail     = safe(contractor.email,     '—');
  const contractorPhone     = safe(contractor.phone,     '—');
  const contractorId        = safe(contractor.nationalId || contractor.idNumber, 'غير مُدرج');
  const contractorSpecialty = safe(
    contractor.specialty || contractor.specialization,
    'مقاول عام'
  );

  // ── Project details ─────────────────────────────────────────
  const projectTitle = safe(contract.projectTitle, 'مشروع غير محدد');
  const projectType  = PROJECT_TYPE_LABELS[contract.projectType] || safe(contract.projectType, 'غير محدد');
  const governorate  = safe(contract.propertyDetails?.governorate, '');
  const district     = safe(contract.propertyDetails?.district, '');
  const location     = [governorate, district].filter(Boolean).join(' — ') || 'غير محدد';
  const area         = contract.propertyDetails?.area
    ? `${contract.propertyDetails.area} م²`
    : 'غير محدد';
  const duration     = contract.proposedDuration
    ? `${contract.proposedDuration} يوم`
    : 'غير محدد';
  const scopeOfWork  = safe(
    contract.scopeOfWork || contract.description,
    'يشمل تنفيذ جميع الأعمال المدنية والإنشائية والمعمارية والتشطيبية المتفق عليها بين الطرفين وفق الرسومات والمواصفات المعتمدة.'
  );

  // ── Financial data ──────────────────────────────────────────
  const bidAmount      = Number(contract.bidAmount || 0);
  const commissionRate = Number(contract.commissionRate || 0.02);
  const commission     = Math.round(bidAmount * commissionRate);
  const net            = bidAmount - commission;
  const m1             = Math.round(net * 0.30);
  const m2             = Math.round(net * 0.40);
  const m3             = net - m1 - m2;
  const warrantyCap    = contract.warrantyCapEGP || 0;

  // ── Dates ────────────────────────────────────────────────────
  const now           = new Date();
  const locale        = 'ar-EG';
  const dateOpts      = { year: 'numeric', month: 'long', day: 'numeric' };
  const contractDate  = new Date(contract.generatedAt || now).toLocaleDateString(locale, dateOpts);
  const genDate       = now.toLocaleDateString(locale, dateOpts);
  const custSignDate  = contract.customerSignature?.signedAt
    ? new Date(contract.customerSignature.signedAt).toLocaleDateString(locale, dateOpts)
    : '________________';
  const contrSignDate = contract.contractorSignature?.signedAt
    ? new Date(contract.contractorSignature.signedAt).toLocaleDateString(locale, dateOpts)
    : '________________';

  // ── Status ───────────────────────────────────────────────────
  const statusEntry  = STATUS_MAP[contract.status] || { label: safe(contract.status, 'مسودة'), cls: 'pending' };
  const contractId   = contract._id.toString().slice(-10).toUpperCase();

  // ── Build logo inline tag ────────────────────────────────────
  const logoTag = buildLogoTag();

  // ── Signature blocks ─────────────────────────────────────────
  const custSigBlock  = buildSigBlock(contract.customerSignature);
  const contrSigBlock = buildSigBlock(contract.contractorSignature);

  // ── Replace all template placeholders ────────────────────────
  const replacements = {
    '{{LOGO_TAG}}':            logoTag,
    '{{CONTRACT_ID}}':         contractId,
    '{{CONTRACT_DATE}}':       contractDate,
    '{{GENERATION_DATE}}':     genDate,
    '{{CONTRACT_STATUS}}':     statusEntry.label,
    '{{STATUS_CLASS}}':        statusEntry.cls,

    '{{CUSTOMER_NAME}}':       customerName,
    '{{CUSTOMER_ID}}':         customerId,
    '{{CUSTOMER_EMAIL}}':      customerEmail,
    '{{CUSTOMER_PHONE}}':      customerPhone,

    '{{CONTRACTOR_NAME}}':     contractorName,
    '{{CONTRACTOR_ID}}':       contractorId,
    '{{CONTRACTOR_SPECIALTY}}': contractorSpecialty,
    '{{CONTRACTOR_EMAIL}}':    contractorEmail,
    '{{CONTRACTOR_PHONE}}':    contractorPhone,

    '{{PROJECT_TITLE}}':       projectTitle,
    '{{PROJECT_TYPE}}':        projectType,
    '{{PROJECT_LOCATION}}':    location,
    '{{PROPERTY_AREA}}':       area,
    '{{PROPOSED_DURATION}}':   duration,
    '{{SCOPE_OF_WORK}}':       scopeOfWork,

    '{{CONTRACT_VALUE}}':      Number(bidAmount).toLocaleString('ar-EG'),
    '{{NET_TO_CONTRACTOR}}':   Number(net).toLocaleString('ar-EG'),
    '{{COMMISSION_RATE}}':     (commissionRate * 100).toFixed(1),
    '{{COMMISSION_AMOUNT}}':   Number(commission).toLocaleString('ar-EG'),
    '{{MILESTONE_1_AMOUNT}}':  Number(m1).toLocaleString('ar-EG'),
    '{{MILESTONE_2_AMOUNT}}':  Number(m2).toLocaleString('ar-EG'),
    '{{MILESTONE_3_AMOUNT}}':  Number(m3).toLocaleString('ar-EG'),
    '{{WARRANTY_CAP}}':        Number(warrantyCap).toLocaleString('ar-EG'),
    '{{WARRANTY_STATUS}}':     safe(contract.warrantyStatus, 'في انتظار التفعيل'),

    '{{CUSTOMER_SIG_BLOCK}}':    custSigBlock,
    '{{CONTRACTOR_SIG_BLOCK}}':  contrSigBlock,
    '{{CUSTOMER_SIGN_DATE}}':    custSignDate,
    '{{CONTRACTOR_SIGN_DATE}}':  contrSignDate,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    // Escape special regex chars in placeholder
    const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(escaped, 'g'), value ?? '');
  }

  // ── Puppeteer rendering ───────────────────────────────────────
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    const page = await browser.newPage();

    // Set RTL HTML content directly (avoids file:// path issues on Windows)
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Inject Google Fonts manually if network is available
    await page.evaluate(() => {
      return document.fonts.ready;
    });

    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      displayHeaderFooter: false,
    });

    logger.info(
      { contractId: contract._id.toString() },
      'Arabic PDF contract generated successfully via Puppeteer'
    );
    return filename;

  } catch (err) {
    logger.error(
      { err: err.message, contractId: contract._id.toString() },
      'Puppeteer PDF generation failed — falling back to PDFKit'
    );
    // ── Fallback: legacy pdfkit generator ──────────────────────
    return generatePDFContractLegacy(contract);
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
}

// ============================================================
// LEGACY FALLBACK — original pdfkit implementation
// Used if Puppeteer fails (e.g., no Chromium available)
// ============================================================
const PDFDocument = require('pdfkit');

async function generatePDFContractLegacy(contract) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `contract_${contract._id}.pdf`;
      const filePath = path.join(CONTRACTS_DIR, filename);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Minimal header
      doc.rect(0, 0, doc.page.width, 80).fill('#0F172A');
      doc.fillColor('#F59E0B').fontSize(22).font('Helvetica-Bold')
         .text('EL-MOQUWAL', 50, 25, { align: 'left' });
      doc.fillColor('#94A3B8').fontSize(10).font('Helvetica')
         .text('Construction Contract', 50, 52, { align: 'right', width: doc.page.width - 100 });
      doc.rect(50, 85, doc.page.width - 100, 3).fill('#F59E0B');
      doc.moveDown(2);

      const customer    = contract.customer   || {};
      const contractor  = contract.contractor || {};
      const bidAmount   = Number(contract.bidAmount || 0);
      const commission  = Math.round(bidAmount * (contract.commissionRate || 0.02));
      const net         = bidAmount - commission;

      const rows = [
        ['Contract ID',        contract._id.toString().slice(-10).toUpperCase()],
        ['Customer',           customer.name || '—'],
        ['Contractor',         contractor.name || '—'],
        ['Project',            contract.projectTitle || '—'],
        ['Value',              `${bidAmount.toLocaleString()} EGP`],
        ['Net to Contractor',  `${net.toLocaleString()} EGP`],
        ['Duration',           contract.proposedDuration ? `${contract.proposedDuration} days` : '—'],
        ['Date',               new Date(contract.generatedAt || Date.now()).toLocaleDateString('en-EG')],
      ];

      rows.forEach(([k, v], i) => {
        const y = doc.y;
        if (i % 2 === 0) doc.rect(50, y, doc.page.width - 100, 20).fill('#F8FAFC');
        doc.fillColor('#64748B').fontSize(9).text(k + ':', 60, y + 4, { width: 160 });
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(String(v), 220, y + 4);
        doc.rect(50, y + 19, doc.page.width - 100, 0.5).fill('#E2E8F0');
        doc.y = y + 22;
      });

      doc.end();
      writeStream.on('finish', () => resolve(filename));
      writeStream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePDFContract };
