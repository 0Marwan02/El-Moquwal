// أداة توليد عقد بصيغة PDF — El-Moquwal Platform
// Phase 5.2: Professional PDF with signature blocks, escrow schedule & platform terms
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const logger = require('./logger');

// ensure contracts directory exists
const CONTRACTS_DIR = path.join(env.UPLOADS_DIR, 'contracts');
if (!fs.existsSync(CONTRACTS_DIR)) {
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
}

// Color palette matching the platform's design system
const COLORS = {
  navy: '#0F172A',
  navyMid: '#1E293B',
  gold: '#F59E0B',
  goldDark: '#B45309',
  success: '#10B981',
  error: '#EF4444',
  muted: '#64748B',
  light: '#94A3B8',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  white: '#FFFFFF',
};

// Project type map (Arabic label)
const PROJECT_TYPE_LABELS = {
  new_construction: 'بناء جديد',
  finishing: 'تشطيبات',
  renovation: 'تجديد',
  repair: 'إصلاح',
  extension: 'توسعة',
  demolition: 'هدم',
  electrical: 'أعمال كهربائية',
  plumbing: 'أعمال سباكة',
  other: 'أخرى',
};

/**
 * يولد ملف PDF للعقد ويحفظه في الـ uploads ويرجع اسم الملف
 * @param {Object} contract — mongoose document (populated customer/contractor)
 * @returns {Promise<string>} filename
 */
async function generatePDFContract(contract) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `contract_${contract._id}.pdf`;
      const filePath = path.join(CONTRACTS_DIR, filename);

      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `El-Moquwal Contract - ${contract.projectTitle || contract._id}`,
          Author: 'El-Moquwal Platform',
          Subject: 'Construction Contract Agreement',
          Creator: 'El-Moquwal',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ─────────────────────────────────────────────
      // HEADER — Platform branding
      // ─────────────────────────────────────────────
      doc
        .rect(0, 0, doc.page.width, 90)
        .fill(COLORS.navy);

      doc
        .fillColor(COLORS.gold)
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('EL-MOQUWAL', 50, 28, { align: 'left' });

      doc
        .fillColor(COLORS.light)
        .fontSize(11)
        .font('Helvetica')
        .text('منصة المقاولات الأولى في مصر', 50, 58, { align: 'left' });

      doc
        .fillColor(COLORS.light)
        .fontSize(11)
        .text('CONTRACT AGREEMENT', 50, 28, { align: 'right', width: doc.page.width - 100 });

      doc
        .fillColor(COLORS.light)
        .fontSize(10)
        .text(`Contract #: ${contract._id.toString().slice(-8).toUpperCase()}`, 50, 58, {
          align: 'right',
          width: doc.page.width - 100,
        });

      // Gold accent line
      doc.moveDown(0.5);
      doc.rect(50, 95, doc.page.width - 100, 3).fill(COLORS.gold);

      // ─────────────────────────────────────────────
      // CONTRACT STATUS BADGE
      // ─────────────────────────────────────────────
      const statusColors = {
        active: COLORS.success,
        pending_signatures: COLORS.gold,
        completed: COLORS.navyMid,
        disputed: COLORS.error,
      };
      const statusLabels = {
        active: 'ACTIVE',
        pending_signatures: 'PENDING SIGNATURES',
        completed: 'COMPLETED',
        disputed: 'DISPUTED',
      };
      const statusColor = statusColors[contract.status] || COLORS.muted;
      const statusLabel = statusLabels[contract.status] || (contract.status || 'DRAFT').toUpperCase();

      doc
        .roundedRect(50, 108, 160, 26, 6)
        .fill(statusColor);

      doc
        .fillColor(COLORS.white)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(statusLabel, 50, 116, { width: 160, align: 'center' });

      doc.moveDown(2.5);

      // ─────────────────────────────────────────────
      // SECTION: PARTIES
      // ─────────────────────────────────────────────
      sectionHeader(doc, '1. PARTIES TO THE CONTRACT');

      const customerName = contract.customer?.name || String(contract.customer);
      const customerEmail = contract.customer?.email || '';
      const customerPhone = contract.customer?.phone || '';

      const contractorName = contract.contractor?.name || String(contract.contractor);
      const contractorEmail = contract.contractor?.email || '';
      const contractorPhone = contract.contractor?.phone || '';
      const contractorSpecialty = contract.contractor?.specialty || '';

      // Two-column parties layout
      const col1X = 50;
      const col2X = doc.page.width / 2 + 10;
      const colW = doc.page.width / 2 - 60;
      const boxY = doc.y;

      // Customer box
      doc.rect(col1X, boxY, colW, 90).fill(COLORS.bg);
      doc.fillColor(COLORS.gold).fontSize(9).font('Helvetica-Bold')
        .text('CLIENT (CUSTOMER)', col1X + 10, boxY + 10);
      doc.fillColor(COLORS.navy).fontSize(12).font('Helvetica-Bold')
        .text(customerName, col1X + 10, boxY + 25);
      if (customerEmail) {
        doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica')
          .text(`Email: ${customerEmail}`, col1X + 10, boxY + 43);
      }
      if (customerPhone) {
        doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica')
          .text(`Phone: ${customerPhone}`, col1X + 10, boxY + 56);
      }

      // Contractor box
      doc.rect(col2X, boxY, colW, 90).fill(COLORS.bg);
      doc.fillColor(COLORS.gold).fontSize(9).font('Helvetica-Bold')
        .text('CONTRACTOR', col2X + 10, boxY + 10);
      doc.fillColor(COLORS.navy).fontSize(12).font('Helvetica-Bold')
        .text(contractorName, col2X + 10, boxY + 25);
      if (contractorSpecialty) {
        doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica')
          .text(`Specialty: ${contractorSpecialty}`, col2X + 10, boxY + 43);
      }
      if (contractorEmail) {
        doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica')
          .text(`Email: ${contractorEmail}`, col2X + 10, boxY + 56);
      }
      if (contractorPhone) {
        doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica')
          .text(`Phone: ${contractorPhone}`, col2X + 10, boxY + 69);
      }

      doc.y = boxY + 100;

      // ─────────────────────────────────────────────
      // SECTION: PROJECT DETAILS
      // ─────────────────────────────────────────────
      sectionHeader(doc, '2. PROJECT DETAILS');

      const projectType = PROJECT_TYPE_LABELS[contract.projectType] || contract.projectType;
      const govText = contract.propertyDetails?.governorate
        ? `${contract.propertyDetails.governorate}${contract.propertyDetails.district ? ' - ' + contract.propertyDetails.district : ''}`
        : 'N/A';
      const areaText = contract.propertyDetails?.area ? `${contract.propertyDetails.area} m²` : 'N/A';

      infoRow(doc, 'Project Title', contract.projectTitle || 'N/A');
      infoRow(doc, 'Project Type', `${projectType} (${contract.projectType})`);
      infoRow(doc, 'Location', govText);
      infoRow(doc, 'Property Area', areaText);
      infoRow(doc, 'Contract Value', `${(contract.bidAmount || 0).toLocaleString()} EGP`);
      infoRow(doc, 'Proposed Duration', contract.proposedDuration ? `${contract.proposedDuration} days` : 'N/A');
      infoRow(doc, 'Contract Date', new Date(contract.generatedAt || Date.now()).toLocaleDateString('en-EG'));

      // ─────────────────────────────────────────────
      // SECTION: FINANCIAL TERMS
      // ─────────────────────────────────────────────
      sectionHeader(doc, '3. FINANCIAL TERMS & ESCROW SCHEDULE');

      const bidAmount = contract.bidAmount || 0;
      const commission = Math.round(bidAmount * (contract.commissionRate || 0.02));
      const netAmount = bidAmount - commission;
      const milestone1 = Math.round(netAmount * 0.3);
      const milestone2 = Math.round(netAmount * 0.4);
      const milestone3 = netAmount - milestone1 - milestone2;

      // Financial summary box
      doc.rect(50, doc.y, doc.page.width - 100, 60).fill(COLORS.navy);
      const finY = doc.y + 10;
      doc.fillColor(COLORS.white).fontSize(10).font('Helvetica-Bold')
        .text('Total Contract Value', 60, finY);
      doc.fillColor(COLORS.gold).fontSize(16).font('Helvetica-Bold')
        .text(`${bidAmount.toLocaleString()} EGP`, 60, finY + 15);

      doc.fillColor(COLORS.light).fontSize(9).font('Helvetica')
        .text(`Platform Commission (${((contract.commissionRate || 0.02) * 100).toFixed(1)}%): ${commission.toLocaleString()} EGP`, 60, finY + 36);
      doc.fillColor(COLORS.light).fontSize(9)
        .text(`Net to Contractor: ${netAmount.toLocaleString()} EGP`, 280, finY + 36);

      doc.y = finY + 70;

      // Escrow milestones table
      tableHeader(doc, ['Milestone', 'Percentage', 'Amount (EGP)', 'Status']);
      tableRow(doc, ['1. Project Kickoff', '30%', milestone1.toLocaleString(), 'Pending'], 0);
      tableRow(doc, ['2. Mid-Project Completion', '40%', milestone2.toLocaleString(), 'Pending'], 1);
      tableRow(doc, ['3. Final Delivery', '30%', milestone3.toLocaleString(), 'Pending'], 0);

      doc.moveDown(0.5);

      // ─────────────────────────────────────────────
      // SECTION: WARRANTY
      // ─────────────────────────────────────────────
      sectionHeader(doc, '4. WARRANTY & GUARANTEE');

      const warrantyCap = contract.warrantyCapEGP || 0;
      doc.fillColor(COLORS.muted).fontSize(10).font('Helvetica')
        .text(
          `The contractor provides a warranty for all works performed under this contract. ` +
          `In the event of a defect or substandard delivery, the client may file a claim ` +
          `through the El-Moquwal platform dispute resolution center.`,
          50, doc.y, { width: doc.page.width - 100 }
        );
      doc.moveDown(0.3);
      infoRow(doc, 'Warranty Coverage Cap', `${warrantyCap.toLocaleString()} EGP`);
      infoRow(doc, 'Warranty Status', contract.warrantyStatus || 'Pending Activation');

      // ─────────────────────────────────────────────
      // SECTION: PLATFORM TERMS
      // ─────────────────────────────────────────────
      sectionHeader(doc, '5. PLATFORM TERMS & CONDITIONS');

      const terms = [
        '• Funds are held in escrow by El-Moquwal until project milestones are completed and approved by the client.',
        '• The contractor must upload before/after photos upon project closure.',
        '• Disputes shall be resolved through the El-Moquwal platform dispute center within 14 business days.',
        '• This contract is legally binding under Egyptian law and El-Moquwal platform terms of service.',
        '• Any amendment must be agreed upon by both parties and documented through the platform.',
        '• El-Moquwal acts as an escrow agent only and is not liable for the quality of work performed.',
      ];

      terms.forEach((term) => {
        doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica')
          .text(term, 50, doc.y, { width: doc.page.width - 100 });
        doc.moveDown(0.25);
      });

      // ─────────────────────────────────────────────
      // SECTION: SIGNATURES
      // ─────────────────────────────────────────────
      // Check if we need a new page for signatures
      if (doc.y > doc.page.height - 220) {
        doc.addPage();
      }

      sectionHeader(doc, '6. DIGITAL SIGNATURES');

      const sigY = doc.y;
      const sigW = (doc.page.width - 120) / 2;

      // Customer signature box
      const custSig = contract.customerSignature;
      drawSignatureBox(doc, 50, sigY, sigW, 120, customerName, 'CLIENT', custSig);

      // Contractor signature box
      const contrSig = contract.contractorSignature;
      drawSignatureBox(doc, 50 + sigW + 20, sigY, sigW, 120, contractorName, 'CONTRACTOR', contrSig);

      doc.y = sigY + 130;

      // ─────────────────────────────────────────────
      // FOOTER
      // ─────────────────────────────────────────────
      const footerY = doc.page.height - 50;
      doc.rect(0, footerY - 15, doc.page.width, 65).fill(COLORS.bg);

      doc
        .fillColor(COLORS.light)
        .fontSize(8)
        .font('Helvetica')
        .text(
          `El-Moquwal Platform | Contract #${contract._id.toString().slice(-8).toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-EG')} | This document is computer-generated.`,
          50, footerY,
          { align: 'center', width: doc.page.width - 100 }
        );

      doc.end();

      writeStream.on('finish', () => {
        logger.info({ contractId: contract._id.toString() }, 'PDF contract generated successfully');
        resolve(filename);
      });

      writeStream.on('error', (err) => {
        logger.error({ err: err.message, contractId: contract._id.toString() }, 'PDF write stream error');
        reject(err);
      });
    } catch (err) {
      logger.error({ err: err.message, contractId: contract._id.toString() }, 'PDF generation failed');
      reject(err);
    }
  });
}

// ─────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────

function sectionHeader(doc, title) {
  doc.moveDown(0.8);
  doc.rect(50, doc.y, doc.page.width - 100, 28).fill(COLORS.navyMid);
  doc
    .fillColor(COLORS.gold)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(title, 60, doc.y - 22, { width: doc.page.width - 120 });
  doc.moveDown(0.8);
}

function infoRow(doc, label, value) {
  const y = doc.y;
  doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica').text(label + ':', 50, y, { width: 180 });
  doc.fillColor(COLORS.navy).fontSize(9).font('Helvetica-Bold').text(String(value), 240, y, { width: doc.page.width - 290 });
  doc.rect(50, y + 14, doc.page.width - 100, 0.5).fill(COLORS.border);
  doc.moveDown(0.7);
}

function tableHeader(doc, cols) {
  const colW = (doc.page.width - 100) / cols.length;
  const y = doc.y;
  doc.rect(50, y, doc.page.width - 100, 22).fill(COLORS.navy);
  cols.forEach((col, i) => {
    doc
      .fillColor(COLORS.gold)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(col, 50 + i * colW + 8, y + 6, { width: colW - 16 });
  });
  doc.y = y + 24;
}

function tableRow(doc, cols, shadeIdx) {
  const colW = (doc.page.width - 100) / cols.length;
  const y = doc.y;
  if (shadeIdx % 2 === 1) {
    doc.rect(50, y, doc.page.width - 100, 20).fill(COLORS.bg);
  }
  cols.forEach((col, i) => {
    doc
      .fillColor(COLORS.navy)
      .fontSize(9)
      .font('Helvetica')
      .text(String(col), 50 + i * colW + 8, y + 5, { width: colW - 16 });
  });
  doc.y = y + 22;
}

function drawSignatureBox(doc, x, y, w, h, name, role, sigData) {
  // Box border
  doc.rect(x, y, w, h).stroke(COLORS.border);

  // Role label
  doc
    .fillColor(COLORS.gold)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(role, x + 10, y + 10, { width: w - 20 });

  // Name
  doc
    .fillColor(COLORS.navy)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text(name, x + 10, y + 25, { width: w - 20 });

  if (sigData?.signed) {
    // Green signed indicator
    doc.rect(x + 10, y + 48, w - 20, 30).fill('#dcfce7');
    doc
      .fillColor(COLORS.success)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('✓ DIGITALLY SIGNED', x + 10, y + 53, { width: w - 20, align: 'center' });
    doc
      .fillColor('#15803d')
      .fontSize(7)
      .font('Helvetica')
      .text(`Hash: ${(sigData.signatureHash || '').slice(0, 16)}...`, x + 10, y + 66, { width: w - 20, align: 'center' });
    doc
      .fillColor(COLORS.muted)
      .fontSize(7)
      .text(`Signed: ${sigData.signedAt ? new Date(sigData.signedAt).toLocaleDateString('en-EG') : ''}`, x + 10, y + 78, {
        width: w - 20, align: 'center',
      });
  } else {
    // Pending placeholder
    doc.rect(x + 10, y + 48, w - 20, 40).dash(4, { space: 3 }).stroke(COLORS.light);
    doc
      .fillColor(COLORS.light)
      .fontSize(9)
      .font('Helvetica')
      .text('Awaiting Signature', x + 10, y + 64, { width: w - 20, align: 'center' });
  }

  doc
    .fillColor(COLORS.light)
    .undash()
    .fontSize(7)
    .font('Helvetica')
    .text(`Date: ____________________`, x + 10, y + 95, { width: w - 20 });
}

module.exports = { generatePDFContract };
