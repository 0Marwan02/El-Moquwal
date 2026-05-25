/**
 * professional_seed.js — Professional demo data for El Moquwal platform.
 *
 * Wipes domain collections and seeds:
 *   - 1 Super Admin
 *   - 2 Admins (reviewers)
 *   - 5 Customers (varied governorates)
 *   - 8 Contractors (varied specialties, premium + free, active + pending)
 *   - 12 Projects (draft, open, awarded, closed, private, featured, urgent)
 *   - Bids, contracts, escrows, portfolio items
 *   - 2 Subscriptions (premium contractors)
 *   - 6 Products (B2B material market) + 2 material orders
 *   - Platform settings (defaults + sample Terms)
 *
 * All accounts share the same password to make demos easy. Login can be done
 * with email OR 14-digit national ID.
 */

const mongoose = require('mongoose');
const argon2 = require('argon2');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../src/config/db');

// Models
const User = require('../src/models/User');
const SuperAdminProfile = require('../src/models/SuperAdminProfile');
const AdminProfile = require('../src/models/AdminProfile');
const CustomerProfile = require('../src/models/CustomerProfile');
const ContractorProfile = require('../src/models/ContractorProfile');
const Project = require('../src/models/Project');
const Bid = require('../src/models/Bid');
const Contract = require('../src/models/Contract');
const Escrow = require('../src/models/Escrow');
const PortfolioItem = require('../src/models/PortfolioItem');
const CreditLedger = require('../src/models/CreditLedger');
const Subscription = require('../src/models/Subscription');
const Transaction = require('../src/models/Transaction');
const Product = require('../src/models/Product');
const MaterialOrder = require('../src/models/MaterialOrder');
const PlatformSettings = require('../src/models/PlatformSettings');

// ===== Helpers =====
function hashNID(nid) {
  return crypto.createHash('sha256').update(nid).digest('hex');
}

const DUMMY_FILE = {
  filename: 'placeholder.jpg',
  originalName: 'placeholder.jpg',
  mimetype: 'image/jpeg',
  size: 102400,
  uploadedAt: new Date(),
};

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

// Default shared password — easy demos
const SHARED_PASSWORD = 'Demo@2026';

async function wipe() {
  console.log('🧹 Wiping existing demo data...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Bid.deleteMany({}),
    Contract.deleteMany({}),
    Escrow.deleteMany({}),
    PortfolioItem.deleteMany({}),
    CreditLedger.deleteMany({}),
    Subscription.deleteMany({}),
    Transaction.deleteMany({}),
    Product.deleteMany({}),
    MaterialOrder.deleteMany({}),
    PlatformSettings.deleteMany({}),
  ]);
}

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await connectDB();

  await wipe();

  const passwordHash = await argon2.hash(SHARED_PASSWORD);

  // =============================================================
  // 1. SUPER ADMIN
  // =============================================================
  console.log('🛡️  Creating Super Admin...');
  const superAdmin = await SuperAdminProfile.create({
    name: 'محمد عبد الرحمن',
    email: 'super@elmoquwal.com',
    phone: '01000000001',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('29001011000001'),
    nationalIdLast4: '0001',
  });

  // =============================================================
  // 2. ADMINS (Reviewers)
  // =============================================================
  console.log('👮 Creating Admins (Reviewers)...');
  const adminAhmed = await AdminProfile.create({
    name: 'أحمد فؤاد - مراجع رئيسي',
    email: 'admin.ahmed@elmoquwal.com',
    phone: '01000000002',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('29101011000002'),
    nationalIdLast4: '0002',
    permissions: [
      'review_contractors', 'view_projects', 'view_stats',
      'manage_disputes', 'manage_featured', 'adjust_credits',
    ],
    createdBySuperAdmin: superAdmin._id,
    notes: 'مسؤول مراجعة المقاولين والنزاعات.',
  });

  const adminMaha = await AdminProfile.create({
    name: 'مها سامي - مراجعة سوق المواد',
    email: 'admin.maha@elmoquwal.com',
    phone: '01000000003',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('29202022000003'),
    nationalIdLast4: '0003',
    permissions: ['view_projects', 'view_stats', 'manage_materials'],
    createdBySuperAdmin: superAdmin._id,
    notes: 'مسؤولة عن سوق المواد والمنتجات.',
  });

  // =============================================================
  // 3. CUSTOMERS
  // =============================================================
  console.log('🧑 Creating Customers...');
  const customers = await CustomerProfile.create([
    {
      name: 'كريم حسن',
      email: 'karim.hassan@example.com',
      phone: '01011112201',
      passwordHash,
      status: 'active',
      isEmailVerified: true,
      nationalIdHash: hashNID('29303031000004'),
      nationalIdLast4: '0004',
      dob: new Date('1993-03-03'),
      gender: 'male',
      governorate: 'القاهرة',
      governorateCode: '01',
    },
    {
      name: 'سارة محمود',
      email: 'sara.mahmoud@example.com',
      phone: '01122223302',
      passwordHash,
      status: 'active',
      isEmailVerified: true,
      nationalIdHash: hashNID('29404041000005'),
      nationalIdLast4: '0005',
      dob: new Date('1994-04-04'),
      gender: 'female',
      governorate: 'الإسكندرية',
      governorateCode: '02',
    },
    {
      name: 'عمر خليل',
      email: 'omar.khalil@example.com',
      phone: '01233334403',
      passwordHash,
      status: 'active',
      isEmailVerified: true,
      nationalIdHash: hashNID('29505051000006'),
      nationalIdLast4: '0006',
      dob: new Date('1985-05-05'),
      gender: 'male',
      governorate: 'الجيزة',
      governorateCode: '21',
    },
    {
      name: 'هالة عبد الله',
      email: 'hala.abdullah@example.com',
      phone: '01544445504',
      passwordHash,
      status: 'active',
      isEmailVerified: true,
      nationalIdHash: hashNID('29606061000007'),
      nationalIdLast4: '0007',
      dob: new Date('1996-06-06'),
      gender: 'female',
      governorate: 'الدقهلية',
      governorateCode: '12',
    },
    {
      name: 'يوسف الشيخ',
      email: 'youssef.elsheikh@example.com',
      phone: '01055556605',
      passwordHash,
      status: 'active',
      isEmailVerified: true,
      nationalIdHash: hashNID('29707071000008'),
      nationalIdLast4: '0008',
      dob: new Date('1997-07-07'),
      gender: 'male',
      governorate: 'البحر الأحمر',
      governorateCode: '24',
    },
  ]);

  const [customerKarim, customerSara, customerOmar, customerHala, customerYoussef] = customers;

  // =============================================================
  // 4. CONTRACTORS
  // =============================================================
  console.log('👷 Creating Contractors...');

  const rowadFoundation = await ContractorProfile.create({
    name: 'مؤسسة الرواد للتشطيبات الفاخرة',
    email: 'rowad@example.com',
    phone: '01511110001',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('28501012000010'),
    nationalIdLast4: '0010',
    specialty: 'finishing',
    yearsOfExperience: 15,
    bio: 'مؤسسة رائدة في تشطيبات الفلل والشقق الفاخرة بالقاهرة الكبرى منذ 2010. خبرة في السوبر لوكس والمواد المستوردة.',
    nationalIdPhoto: DUMMY_FILE,
    certificate: DUMMY_FILE,
    membershipCard: DUMMY_FILE,
    profilePicture: DUMMY_FILE,
    approvedBy: adminAhmed._id,
    approvedAt: daysAgo(180),
    rating: 4.8,
    completedProjects: 12,
    creditBalance: 25,
    isPremium: true,
    premiumUntil: daysFromNow(25),
  });

  const elmasryConstruction = await ContractorProfile.create({
    name: 'شركة المصري للمقاولات العامة',
    email: 'elmasry@example.com',
    phone: '01022220002',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('28202022000011'),
    nationalIdLast4: '0011',
    specialty: 'general_contractor',
    yearsOfExperience: 20,
    bio: 'شركة مقاولات عامة متخصصة في البناء من الأساسات حتى التسليم. أكثر من 50 مشروع سكني وتجاري.',
    nationalIdPhoto: DUMMY_FILE,
    certificate: DUMMY_FILE,
    profilePicture: DUMMY_FILE,
    approvedBy: adminAhmed._id,
    approvedAt: daysAgo(200),
    rating: 4.6,
    completedProjects: 18,
    creditBalance: 40,
    isPremium: true,
    premiumUntil: daysFromNow(15),
  });

  const engKhaledArchitect = await ContractorProfile.create({
    name: 'م. خالد عاطف - استشاري معماري',
    email: 'khaled.arch@example.com',
    phone: '01033330003',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('28303032000012'),
    nationalIdLast4: '0012',
    specialty: 'architect',
    yearsOfExperience: 12,
    bio: 'مهندس معماري واستشاري — تصميم فلل ومجمعات سكنية. خبرة في أنظمة الطاقة المتجددة.',
    nationalIdPhoto: DUMMY_FILE,
    certificate: DUMMY_FILE,
    membershipCard: DUMMY_FILE,
    profilePicture: DUMMY_FILE,
    approvedBy: adminAhmed._id,
    approvedAt: daysAgo(120),
    rating: 4.9,
    completedProjects: 8,
    creditBalance: 15,
  });

  const engNadiaCivil = await ContractorProfile.create({
    name: 'م. نادية إبراهيم - مهندسة مدنية',
    email: 'nadia.civil@example.com',
    phone: '01244440004',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('28804042000013'),
    nationalIdLast4: '0013',
    specialty: 'civil_engineer',
    yearsOfExperience: 9,
    bio: 'مهندسة مدنية — متخصصة في الإشراف على الأعمال الإنشائية والتحقق من جودة الخرسانة والحديد.',
    nationalIdPhoto: DUMMY_FILE,
    certificate: DUMMY_FILE,
    profilePicture: DUMMY_FILE,
    approvedBy: adminAhmed._id,
    approvedAt: daysAgo(90),
    rating: 4.7,
    completedProjects: 6,
    creditBalance: 12,
  });

  const essamPlumbing = await ContractorProfile.create({
    name: 'عصام الصاوي - أعمال سباكة',
    email: 'essam.plumbing@example.com',
    phone: '01555550005',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('28905052000014'),
    nationalIdLast4: '0014',
    specialty: 'plumber',
    yearsOfExperience: 7,
    bio: 'سباك محترف — كشف تسريبات بالأجهزة الحديثة، تركيب شبكات مياه وصرف، صيانة سخانات.',
    nationalIdPhoto: DUMMY_FILE,
    profilePicture: DUMMY_FILE,
    approvedBy: adminAhmed._id,
    approvedAt: daysAgo(60),
    rating: 4.5,
    completedProjects: 14,
    creditBalance: 10,
  });

  const mohamedElectrical = await ContractorProfile.create({
    name: 'محمد فاروق - فني كهرباء',
    email: 'mohamed.elec@example.com',
    phone: '01066660006',
    passwordHash,
    status: 'active',
    isEmailVerified: true,
    nationalIdHash: hashNID('29006062000015'),
    nationalIdLast4: '0015',
    specialty: 'electrical',
    yearsOfExperience: 6,
    bio: 'فني كهرباء معتمد — تأسيس وتشطيب كهرباء المنازل والمحلات، تركيب لوحات توزيع، حماية ضد التماس.',
    nationalIdPhoto: DUMMY_FILE,
    certificate: DUMMY_FILE,
    profilePicture: DUMMY_FILE,
    approvedBy: adminAhmed._id,
    approvedAt: daysAgo(50),
    rating: 4.4,
    completedProjects: 9,
    creditBalance: 8,
  });

  // Pending contractor (awaiting approval)
  const pendingContractor = await ContractorProfile.create({
    name: 'م. مصطفى الجمل',
    email: 'mostafa.pending@example.com',
    phone: '01177770007',
    passwordHash,
    status: 'pending',
    isEmailVerified: true,
    nationalIdHash: hashNID('29407072000016'),
    nationalIdLast4: '0016',
    specialty: 'civil_engineer',
    yearsOfExperience: 4,
    bio: 'مهندس مدني حديث التخرج، خبرة في مشاريع البنية التحتية الصغيرة.',
    nationalIdPhoto: DUMMY_FILE,
    certificate: DUMMY_FILE,
    creditBalance: 5,
  });

  // Suspended (rejected) contractor
  const suspendedContractor = await ContractorProfile.create({
    name: 'إبراهيم سعيد',
    email: 'ibrahim.rejected@example.com',
    phone: '01088880008',
    passwordHash,
    status: 'suspended',
    isEmailVerified: true,
    nationalIdHash: hashNID('29008082000017'),
    nationalIdLast4: '0017',
    specialty: 'painter',
    yearsOfExperience: 2,
    bio: 'دهانات منازل ومحلات.',
    nationalIdPhoto: DUMMY_FILE,
    rejectionReason: 'الشهادات المقدمة لم تتم مراجعتها بشكل كاف. يُرجى إعادة التقديم بمستندات أوضح.',
    creditBalance: 0,
  });

  // =============================================================
  // 5. SUBSCRIPTIONS + Transactions (for premium contractors)
  // =============================================================
  console.log('💎 Creating Subscriptions...');
  const subTx1 = await Transaction.create({
    user: rowadFoundation._id,
    type: 'subscription',
    amount: 199,
    status: 'success',
    gateway: 'mock',
    gatewayTransactionId: 'MOCK-SUB-001',
    meta: { plan: 'premium', months: 1 },
  });
  const sub1 = await Subscription.create({
    user: rowadFoundation._id,
    plan: 'premium',
    priceEGP: 199,
    startDate: daysAgo(5),
    endDate: daysFromNow(25),
    status: 'active',
    transactionId: subTx1._id,
    creditsGranted: 10,
  });
  rowadFoundation.subscriptionId = sub1._id;
  await rowadFoundation.save();

  const subTx2 = await Transaction.create({
    user: elmasryConstruction._id,
    type: 'subscription',
    amount: 199,
    status: 'success',
    gateway: 'mock',
    gatewayTransactionId: 'MOCK-SUB-002',
    meta: { plan: 'premium', months: 1 },
  });
  const sub2 = await Subscription.create({
    user: elmasryConstruction._id,
    plan: 'premium',
    priceEGP: 199,
    startDate: daysAgo(15),
    endDate: daysFromNow(15),
    status: 'active',
    transactionId: subTx2._id,
    creditsGranted: 10,
  });
  elmasryConstruction.subscriptionId = sub2._id;
  await elmasryConstruction.save();

  // =============================================================
  // 6. CREDIT LEDGERS (signup grants)
  // =============================================================
  console.log('💳 Creating Credit Ledgers...');
  const contractorsForCredits = [
    [rowadFoundation, 25],
    [elmasryConstruction, 40],
    [engKhaledArchitect, 15],
    [engNadiaCivil, 12],
    [essamPlumbing, 10],
    [mohamedElectrical, 8],
    [pendingContractor, 5],
  ];
  for (const [c, balance] of contractorsForCredits) {
    await CreditLedger.create({
      user: c._id,
      delta: 5,
      reason: 'signup_grant',
      balanceAfter: 5,
      meta: 'هدية تسجيل',
    });
    if (balance > 5) {
      await CreditLedger.create({
        user: c._id,
        delta: balance - 5,
        reason: 'purchase',
        balanceAfter: balance,
        meta: 'شراء حزمة نقاط',
      });
    }
  }

  // =============================================================
  // 7. PROJECTS — varied states & types
  // =============================================================
  console.log('🏗️  Creating Projects...');

  // P1 — OPEN, Featured + Urgent, finishing in Cairo
  const p1 = await Project.create({
    title: 'تشطيب شقة سوبر لوكس 220 متر بالتجمع الخامس',
    description: 'شقة دور أرضي بحديقة خاصة بحاجة لتشطيب سوبر لوكس متكامل: سباكة، كهرباء، أرضيات بورسلين فاخر، دهانات جوتن، أبواب وشبابيك ألوميتال، مطبخ وحمامات كاملة. يُفضل مقاول لديه سابقة أعمال في التجمع.',
    projectType: 'finishing',
    propertyDetails: {
      governorate: 'القاهرة',
      city: 'القاهرة الجديدة',
      district: 'التجمع الخامس - الحي الأول',
      area: 220,
      floors: 1,
      rooms: 3,
      bathrooms: 3,
      gpsCoords: { lat: 30.0276, lng: 31.4956 },
    },
    requirements: {
      'الأرضيات': 'بورسلين إيطالي',
      'الدهانات': 'جوتن - بريميوم',
      'المطبخ': 'كاسات HPL مع رخام طبيعي',
      'مستوى التشطيب': 'سوبر لوكس',
    },
    budgetRange: '500k_1m',
    timeline: '3_6_months',
    requiredEngineers: 1,
    postedBy: customerKarim._id,
    status: 'open',
    isFeatured: true,
    featuredUntil: daysFromNow(20),
    isUrgent: true,
    bidsCount: 0,
    aiEstimatedPrice: {
      minEstimate: 650000,
      maxEstimate: 920000,
      currency: 'EGP',
      reasoning: 'استنادًا إلى متوسط أسعار التشطيب السوبر لوكس بالقاهرة الجديدة (3,000–4,200 ج/م²) وحجم المشروع وطبيعة المواد المطلوبة.',
      estimatedAt: daysAgo(2),
      model: 'claude-sonnet-4-6',
    },
  });

  // P2 — OPEN, Urgent plumbing in Alexandria
  const p2 = await Project.create({
    title: 'كشف تسريب وإصلاح شبكة سباكة عاجل',
    description: 'يوجد تسريب مياه واضح من سقف الحمام الرئيسي وأبيار صرف بطيء. مطلوب سباك للكشف بالأجهزة وإصلاح المشكلة من الجذر مع ضمان.',
    projectType: 'plumbing',
    propertyDetails: {
      governorate: 'الإسكندرية',
      city: 'الإسكندرية',
      district: 'سموحة',
      area: 120,
      floors: 1,
      bathrooms: 2,
    },
    requirements: {
      'نوع الخدمة': 'كشف وإصلاح',
      'العاجل': 'نعم',
    },
    budgetRange: 'under_50k',
    timeline: 'within_week',
    postedBy: customerSara._id,
    status: 'open',
    isUrgent: true,
    bidsCount: 0,
  });

  // P3 — OPEN, electrical work in Giza
  const p3 = await Project.create({
    title: 'تأسيس كهرباء فيلا دورين بالشيخ زايد',
    description: 'فيلا قيد التشييد دورين ومسروبة، الهيكل جاهز والآن مطلوب تأسيس كهرباء كامل: لوحة توزيع رئيسية، شبكة، إنارة ديكور LED، تأسيس انتركم وكاميرات.',
    projectType: 'electrical',
    propertyDetails: {
      governorate: 'الجيزة',
      city: '6 أكتوبر',
      district: 'الشيخ زايد - الحي 12',
      area: 380,
      floors: 2,
      rooms: 6,
      bathrooms: 4,
    },
    requirements: {
      'لوحة توزيع': 'Schneider',
      'الإنارة': 'LED مخفي',
      'إنذار حريق': 'مطلوب',
    },
    budgetRange: '200k_500k',
    timeline: '1_3_months',
    requiredEngineers: 1,
    postedBy: customerOmar._id,
    status: 'open',
    bidsCount: 0,
  });

  // P4 — OPEN, finishing, Mansoura
  const p4 = await Project.create({
    title: 'تشطيب شقة عروسة 150 متر بالمنصورة',
    description: 'تشطيب لوكس لشقة عروسة بمستوى متوسط مرتفع. مطلوب: محارة، أرضيات، دهانات، باركيه غرف نوم، مطبخ بسيط، حمامين.',
    projectType: 'finishing',
    propertyDetails: {
      governorate: 'الدقهلية',
      city: 'المنصورة',
      district: 'حي الجامعة',
      area: 150,
      floors: 1,
      rooms: 3,
      bathrooms: 2,
    },
    budgetRange: '200k_500k',
    timeline: '3_6_months',
    postedBy: customerHala._id,
    status: 'open',
    bidsCount: 0,
  });

  // P5 — DRAFT, new villa construction (Sahel)
  const p5 = await Project.create({
    title: 'بناء فيلا 450 متر بمراسي الساحل الشمالي',
    description: 'مسودة لمشروع فيلا دورين على بحيرة صناعية بمراسي، مطلوب مقاول عام يدير المشروع من الحفر للتسليم على المفتاح.',
    projectType: 'new_construction',
    propertyDetails: {
      governorate: 'مطروح',
      city: 'الساحل الشمالي',
      district: 'مراسي - منطقة البحيرات',
      area: 450,
      floors: 2,
      rooms: 5,
      bathrooms: 5,
    },
    budgetRange: 'above_1m',
    timeline: '3_6_months',
    requiredEngineers: 2,
    postedBy: customerYoussef._id,
    status: 'draft',
  });

  // P6 — OPEN, renovation, private (invite-only)
  const p6 = await Project.create({
    title: 'تجديد مكتب إداري 180 متر بوسط البلد',
    description: 'مكتب إداري قديم بحاجة لتجديد كامل: محارة، دهانات حديثة، أرضيات فينيل، إعادة توزيع الفواصل الزجاجية، تكييفات مركزية.',
    projectType: 'renovation',
    propertyDetails: {
      governorate: 'القاهرة',
      city: 'القاهرة',
      district: 'وسط البلد - شارع طلعت حرب',
      area: 180,
      floors: 1,
      rooms: 6,
      bathrooms: 2,
    },
    budgetRange: '200k_500k',
    timeline: '1_3_months',
    postedBy: customerKarim._id,
    status: 'open',
    isPrivate: true,
    invitedContractors: [rowadFoundation._id, elmasryConstruction._id],
    bidsCount: 0,
  });

  // P7 — AWARDED to Rowad (Karim's earlier finishing project)
  const p7 = await Project.create({
    title: 'تشطيب شقة 140 متر بمدينة نصر',
    description: 'تشطيب شقة بمستوى لوكس بمنطقة مكرم عبيد، مدينة نصر.',
    projectType: 'finishing',
    propertyDetails: {
      governorate: 'القاهرة',
      city: 'القاهرة',
      district: 'مدينة نصر - مكرم عبيد',
      area: 140,
      rooms: 3,
      bathrooms: 2,
    },
    budgetRange: '200k_500k',
    timeline: '3_6_months',
    postedBy: customerKarim._id,
    status: 'awarded',
    awardedTo: rowadFoundation._id,
    awardedAt: daysAgo(20),
    bidsCount: 3,
  });

  // P8 — CLOSED with rating, finishing by Rowad
  const p8 = await Project.create({
    title: 'تشطيب صيدلية 80 متر بحلوان',
    description: 'تشطيب صيدلية كامل وفقاً لاشتراطات وزارة الصحة، بما في ذلك الأرفف الزجاجية والتبريد.',
    projectType: 'finishing',
    propertyDetails: {
      governorate: 'القاهرة',
      city: 'حلوان',
      district: 'حلوان',
      area: 80,
      rooms: 2,
      bathrooms: 1,
    },
    budgetRange: '50k_200k',
    timeline: '1_3_months',
    postedBy: customerOmar._id,
    status: 'closed',
    awardedTo: rowadFoundation._id,
    awardedAt: daysAgo(60),
    closedAt: daysAgo(7),
    clientRating: 5,
    clientReview: 'شغل ممتاز جداً، التزام بالمواعيد ونظافة في التنفيذ. أنصح بهم بقوة.',
    bidsCount: 2,
    closurePhotos: {
      before: [DUMMY_FILE, DUMMY_FILE],
      after: [DUMMY_FILE, DUMMY_FILE, DUMMY_FILE],
    },
  });

  // P9 — CLOSED, civil engineering by Nadia
  const p9 = await Project.create({
    title: 'إشراف هندسي على بناء عمارة سكنية',
    description: 'إشراف هندسي على بناء عمارة 4 أدوار بالساحل، تشمل المتابعة الأسبوعية والتقارير الفنية.',
    projectType: 'new_construction',
    propertyDetails: {
      governorate: 'البحر الأحمر',
      city: 'الغردقة',
      district: 'مبارك 7',
      area: 600,
      floors: 4,
      rooms: 16,
      bathrooms: 8,
    },
    budgetRange: '500k_1m',
    timeline: '3_6_months',
    postedBy: customerYoussef._id,
    status: 'closed',
    awardedTo: engNadiaCivil._id,
    awardedAt: daysAgo(180),
    closedAt: daysAgo(30),
    clientRating: 4,
    clientReview: 'مهندسة محترفة جداً، تقارير مفصلة وملاحظات دقيقة.',
    bidsCount: 4,
    closurePhotos: {
      before: [DUMMY_FILE],
      after: [DUMMY_FILE, DUMMY_FILE],
    },
  });

  // P10 — AWARDED (electrical) by Mohamed
  const p10 = await Project.create({
    title: 'تأسيس كهرباء محل ملابس بسموحة',
    description: 'محل ملابس 60 متر يحتاج تأسيس كهرباء كامل بنظام إنارة ديكور وفترينات.',
    projectType: 'electrical',
    propertyDetails: {
      governorate: 'الإسكندرية',
      city: 'الإسكندرية',
      district: 'سموحة',
      area: 60,
      rooms: 1,
    },
    budgetRange: '50k_200k',
    timeline: 'within_month',
    postedBy: customerSara._id,
    status: 'awarded',
    awardedTo: mohamedElectrical._id,
    awardedAt: daysAgo(10),
    bidsCount: 2,
  });

  // P11 — OPEN, painter work (small) — Hala
  const p11 = await Project.create({
    title: 'دهان شقة 110 متر بالمنصورة',
    description: 'دهان كامل لشقة 110 متر، 3 غرف، مطلوب دهانات جوتن مات للحوائط ولامع للأبواب.',
    projectType: 'finishing',
    propertyDetails: {
      governorate: 'الدقهلية',
      city: 'المنصورة',
      district: 'حي الجامعة',
      area: 110,
      rooms: 3,
      bathrooms: 2,
    },
    budgetRange: 'under_50k',
    timeline: 'within_month',
    postedBy: customerHala._id,
    status: 'open',
    bidsCount: 0,
  });

  // P12 — OPEN, extension by Omar
  const p12 = await Project.create({
    title: 'توسعة دور أرضي 80 متر بالمنصورة',
    description: 'توسعة جزء من الفناء الأمامي بدور أرضي إضافي 80 متر بأعمال خرسانة وحوائط ومحارة.',
    projectType: 'extension',
    propertyDetails: {
      governorate: 'الدقهلية',
      city: 'المنصورة',
      district: 'طلخا',
      area: 80,
      floors: 1,
      rooms: 2,
      bathrooms: 1,
    },
    budgetRange: '200k_500k',
    timeline: '3_6_months',
    requiredEngineers: 1,
    postedBy: customerOmar._id,
    status: 'open',
    bidsCount: 0,
  });

  // =============================================================
  // 8. BIDS — across multiple projects
  // =============================================================
  console.log('📜 Creating Bids...');

  // P1 bids (open, featured)
  const p1Bids = await Bid.create([
    { project: p1._id, contractor: rowadFoundation._id, amount: 780000, message: 'عرض شامل سوبر لوكس مع ضمان عامين على كل الأعمال.', proposedDurationDays: 110 },
    { project: p1._id, contractor: elmasryConstruction._id, amount: 720000, message: 'سعر تنافسي مع جدولة دفعات ميسرة.', proposedDurationDays: 130 },
    { project: p1._id, contractor: engKhaledArchitect._id, amount: 850000, message: 'تشطيب فاخر بتصميم مخصص.', proposedDurationDays: 120 },
  ]);
  p1.bidsCount = p1Bids.length;
  await p1.save();

  // P2 bids (urgent plumbing)
  const p2Bids = await Bid.create([
    { project: p2._id, contractor: essamPlumbing._id, amount: 4500, message: 'مستعد للحضور اليوم والكشف بأجهزة Ultra Sound.', proposedDurationDays: 2 },
  ]);
  p2.bidsCount = p2Bids.length;
  await p2.save();

  // P3 bids (electrical)
  const p3Bids = await Bid.create([
    { project: p3._id, contractor: mohamedElectrical._id, amount: 245000, message: 'تأسيس كامل مع ضمان سنتين.', proposedDurationDays: 45 },
    { project: p3._id, contractor: elmasryConstruction._id, amount: 280000, message: 'تنفيذ بفريق متكامل وإشراف مهندس.', proposedDurationDays: 40 },
  ]);
  p3.bidsCount = p3Bids.length;
  await p3.save();

  // P4 bids
  const p4Bids = await Bid.create([
    { project: p4._id, contractor: rowadFoundation._id, amount: 320000, message: 'تشطيب لوكس مع جدولة دفعات.', proposedDurationDays: 90 },
    { project: p4._id, contractor: engKhaledArchitect._id, amount: 380000, message: 'تشطيب مع تصميم 3D مجاني.', proposedDurationDays: 75 },
  ]);
  p4.bidsCount = p4Bids.length;
  await p4.save();

  // P6 bids (private invite)
  const p6Bids = await Bid.create([
    { project: p6._id, contractor: rowadFoundation._id, amount: 285000, message: 'عرض خاص للعميل بنا منذ مشاريع سابقة.', proposedDurationDays: 50 },
    { project: p6._id, contractor: elmasryConstruction._id, amount: 310000, message: 'تنفيذ على دفعتين بالكامل.', proposedDurationDays: 45 },
  ]);
  p6.bidsCount = p6Bids.length;
  await p6.save();

  // P7 bids (awarded to Rowad)
  const p7BidWinner = await Bid.create({
    project: p7._id, contractor: rowadFoundation._id, amount: 360000,
    message: 'عرض شامل المواد والعمالة مع تقدير زمني واضح.',
    proposedDurationDays: 100, status: 'accepted', respondedAt: daysAgo(20),
  });
  await Bid.create([
    { project: p7._id, contractor: elmasryConstruction._id, amount: 395000, message: 'تنفيذ بمواد مستوردة فقط.', proposedDurationDays: 95, status: 'rejected', respondedAt: daysAgo(20) },
    { project: p7._id, contractor: engKhaledArchitect._id, amount: 410000, message: 'إشراف معماري وتصميم داخلي.', proposedDurationDays: 110, status: 'rejected', respondedAt: daysAgo(20) },
  ]);
  p7.awardedBidId = p7BidWinner._id;
  await p7.save();

  // P8 bids (closed, won by Rowad)
  const p8BidWinner = await Bid.create({
    project: p8._id, contractor: rowadFoundation._id, amount: 145000,
    message: 'تشطيب صيدليات تخصصنا، نلتزم باشتراطات الصحة بدقة.',
    proposedDurationDays: 35, status: 'accepted', respondedAt: daysAgo(60),
  });
  await Bid.create({
    project: p8._id, contractor: engKhaledArchitect._id, amount: 165000,
    message: 'مع تصميم داخلي.', proposedDurationDays: 30,
    status: 'rejected', respondedAt: daysAgo(60),
  });
  p8.awardedBidId = p8BidWinner._id;
  await p8.save();

  // P9 bids (closed, won by Nadia)
  const p9BidWinner = await Bid.create({
    project: p9._id, contractor: engNadiaCivil._id, amount: 540000,
    message: 'إشراف هندسي أسبوعي مع تقارير معتمدة.',
    proposedDurationDays: 150, status: 'accepted', respondedAt: daysAgo(180),
  });
  await Bid.create([
    { project: p9._id, contractor: elmasryConstruction._id, amount: 620000, message: 'إشراف يومي مع مهندس مقيم.', proposedDurationDays: 150, status: 'rejected', respondedAt: daysAgo(180) },
    { project: p9._id, contractor: engKhaledArchitect._id, amount: 680000, message: 'إشراف معماري إضافي.', proposedDurationDays: 150, status: 'rejected', respondedAt: daysAgo(180) },
    { project: p9._id, contractor: rowadFoundation._id, amount: 575000, message: 'فريق متكامل.', proposedDurationDays: 160, status: 'rejected', respondedAt: daysAgo(180) },
  ]);
  p9.awardedBidId = p9BidWinner._id;
  await p9.save();

  // P10 bids (awarded electrical)
  const p10BidWinner = await Bid.create({
    project: p10._id, contractor: mohamedElectrical._id, amount: 55000,
    message: 'تأسيس كامل مع إنارة ديكور حديثة.',
    proposedDurationDays: 14, status: 'accepted', respondedAt: daysAgo(10),
  });
  await Bid.create({
    project: p10._id, contractor: elmasryConstruction._id, amount: 72000,
    message: 'تنفيذ بفريق إنارة متخصص.', proposedDurationDays: 12,
    status: 'rejected', respondedAt: daysAgo(10),
  });
  p10.awardedBidId = p10BidWinner._id;
  await p10.save();

  // Deduct credits for active bids (recent only, simplified ledger)
  const allRecentBids = [...p1Bids, ...p2Bids, ...p3Bids, ...p4Bids, ...p6Bids];
  for (const b of allRecentBids) {
    await CreditLedger.create({
      user: b.contractor,
      delta: -1,
      reason: 'bid_submit',
      balanceAfter: 0, // illustrative — real flow recomputes
      project: b.project,
      bid: b._id,
      meta: 'خصم نقطة عرض',
    });
  }

  // =============================================================
  // 9. CONTRACTS (for awarded/closed projects)
  // =============================================================
  console.log('📑 Creating Contracts...');

  await Contract.create({
    project: p7._id,
    bid: p7BidWinner._id,
    customer: customerKarim._id,
    contractor: rowadFoundation._id,
    projectTitle: p7.title,
    projectType: p7.projectType,
    bidAmount: p7BidWinner.amount,
    proposedDuration: p7BidWinner.proposedDurationDays,
    propertyDetails: p7.propertyDetails,
    commissionRate: 0.02,
    warrantyCapEGP: 36000,
    customerSignature: {
      signed: true, signedAt: daysAgo(19),
      ipAddress: '156.0.0.10', userAgent: 'Mozilla/5.0',
      signatureHash: crypto.createHash('sha256').update('cust-sig-p7').digest('hex'),
    },
    contractorSignature: {
      signed: true, signedAt: daysAgo(19),
      ipAddress: '156.0.0.20', userAgent: 'Mozilla/5.0',
      signatureHash: crypto.createHash('sha256').update('cont-sig-p7').digest('hex'),
    },
    status: 'active',
    generatedAt: daysAgo(20),
    warrantyStatus: 'active',
  });

  await Contract.create({
    project: p8._id,
    bid: p8BidWinner._id,
    customer: customerOmar._id,
    contractor: rowadFoundation._id,
    projectTitle: p8.title,
    projectType: p8.projectType,
    bidAmount: p8BidWinner.amount,
    proposedDuration: p8BidWinner.proposedDurationDays,
    propertyDetails: p8.propertyDetails,
    commissionRate: 0.02,
    warrantyCapEGP: 14500,
    customerSignature: {
      signed: true, signedAt: daysAgo(60),
      ipAddress: '156.0.0.30', userAgent: 'Mozilla/5.0',
      signatureHash: crypto.createHash('sha256').update('cust-sig-p8').digest('hex'),
    },
    contractorSignature: {
      signed: true, signedAt: daysAgo(60),
      ipAddress: '156.0.0.40', userAgent: 'Mozilla/5.0',
      signatureHash: crypto.createHash('sha256').update('cont-sig-p8').digest('hex'),
    },
    status: 'completed',
    generatedAt: daysAgo(60),
    warrantyStatus: 'active',
  });

  await Contract.create({
    project: p10._id,
    bid: p10BidWinner._id,
    customer: customerSara._id,
    contractor: mohamedElectrical._id,
    projectTitle: p10.title,
    projectType: p10.projectType,
    bidAmount: p10BidWinner.amount,
    proposedDuration: p10BidWinner.proposedDurationDays,
    propertyDetails: p10.propertyDetails,
    commissionRate: 0.02,
    warrantyCapEGP: 5500,
    customerSignature: {
      signed: true, signedAt: daysAgo(9),
      ipAddress: '156.0.0.50', userAgent: 'Mozilla/5.0',
      signatureHash: crypto.createHash('sha256').update('cust-sig-p10').digest('hex'),
    },
    contractorSignature: { signed: false },
    status: 'pending_signatures',
    generatedAt: daysAgo(9),
    warrantyStatus: 'none',
  });

  // =============================================================
  // 10. ESCROWS (one with active milestones, one fully released)
  // =============================================================
  console.log('🔒 Creating Escrows...');

  // Active escrow for P7
  const escrowP7Total = 360000;
  const escrowP7Commission = Math.round(escrowP7Total * 0.02);
  await Escrow.create({
    project: p7._id,
    customer: customerKarim._id,
    contractor: rowadFoundation._id,
    totalAmount: escrowP7Total,
    commissionAmount: escrowP7Commission,
    netAmount: escrowP7Total - escrowP7Commission,
    status: 'partially_released',
    milestones: [
      { title: 'دفعة المقدم — تجهيز المواد', amount: 120000, percentage: 33.33, status: 'released', releasedAt: daysAgo(18) },
      { title: 'الدفعة الثانية — انتهاء أعمال السباكة والكهرباء', amount: 120000, percentage: 33.33, status: 'pending' },
      { title: 'الدفعة الأخيرة — التسليم النهائي', amount: 120000, percentage: 33.34, status: 'pending' },
    ],
    depositedAt: daysAgo(19),
  });

  // Fully released escrow for P8
  const escrowP8Total = 145000;
  const escrowP8Commission = Math.round(escrowP8Total * 0.02);
  await Escrow.create({
    project: p8._id,
    customer: customerOmar._id,
    contractor: rowadFoundation._id,
    totalAmount: escrowP8Total,
    commissionAmount: escrowP8Commission,
    netAmount: escrowP8Total - escrowP8Commission,
    status: 'released',
    milestones: [
      { title: 'دفعة المقدم', amount: 60000, percentage: 41.38, status: 'released', releasedAt: daysAgo(58) },
      { title: 'دفعة منتصف المشروع', amount: 40000, percentage: 27.59, status: 'released', releasedAt: daysAgo(30) },
      { title: 'دفعة التسليم', amount: 45000, percentage: 31.03, status: 'released', releasedAt: daysAgo(7) },
    ],
    depositedAt: daysAgo(58),
    fullyReleasedAt: daysAgo(7),
  });

  // Disputed escrow — for demo purposes attach to P9
  await Escrow.create({
    project: p9._id,
    customer: customerYoussef._id,
    contractor: engNadiaCivil._id,
    totalAmount: 540000,
    commissionAmount: 10800,
    netAmount: 529200,
    status: 'disputed',
    milestones: [
      { title: 'دفعة بداية الإشراف', amount: 180000, percentage: 33.33, status: 'released', releasedAt: daysAgo(170) },
      { title: 'دفعة منتصف العمل', amount: 180000, percentage: 33.33, status: 'released', releasedAt: daysAgo(90) },
      { title: 'دفعة التسليم النهائي', amount: 180000, percentage: 33.34, status: 'disputed' },
    ],
    depositedAt: daysAgo(180),
    disputeReason: 'تأخر في تسليم التقرير النهائي للمشروع لمدة أسبوعين بدون مبرر.',
    disputeOpenedAt: daysAgo(15),
    disputeOpenedBy: customerYoussef._id,
  });

  // Commission transactions (mirror of released escrows)
  await Transaction.create([
    {
      user: customerKarim._id, type: 'escrow_deposit', amount: escrowP7Total,
      status: 'success', gateway: 'mock', gatewayTransactionId: 'ESCROW-P7-DEP',
      relatedProject: p7._id,
    },
    {
      user: rowadFoundation._id, type: 'escrow_release', amount: 120000 - Math.round(120000 * 0.02),
      status: 'success', gateway: 'mock', gatewayTransactionId: 'ESCROW-P7-REL-1',
      relatedProject: p7._id,
    },
    {
      user: customerOmar._id, type: 'escrow_deposit', amount: escrowP8Total,
      status: 'success', gateway: 'mock', gatewayTransactionId: 'ESCROW-P8-DEP',
      relatedProject: p8._id,
    },
    {
      user: rowadFoundation._id, type: 'escrow_release', amount: escrowP8Total - escrowP8Commission,
      status: 'success', gateway: 'mock', gatewayTransactionId: 'ESCROW-P8-REL',
      relatedProject: p8._id,
    },
    {
      user: superAdmin._id, type: 'commission', amount: escrowP7Commission + escrowP8Commission,
      status: 'success', gateway: 'mock',
      meta: { source: 'platform_commission_total' },
    },
  ]);

  // =============================================================
  // 11. PORTFOLIO ITEMS (auto-generated from closed projects + manual)
  // =============================================================
  console.log('🎨 Creating Portfolio Items...');

  await PortfolioItem.create([
    {
      contractor: rowadFoundation._id,
      title: 'تشطيب صيدلية حلوان',
      description: 'تنفيذ كامل لتشطيب صيدلية وفقاً للاشتراطات الصحية.',
      projectType: 'finishing',
      images: [DUMMY_FILE, DUMMY_FILE, DUMMY_FILE],
      beforePhotos: [DUMMY_FILE, DUMMY_FILE],
      afterPhotos: [DUMMY_FILE, DUMMY_FILE, DUMMY_FILE],
      sourceProject: p8._id,
      isAutoGenerated: true,
    },
    {
      contractor: rowadFoundation._id,
      title: 'تشطيب فيلا 350م بالقطامية',
      description: 'تشطيب سوبر لوكس لفيلا في كمبوند بالقطامية هايتس.',
      projectType: 'finishing',
      images: [DUMMY_FILE, DUMMY_FILE, DUMMY_FILE, DUMMY_FILE],
      isAutoGenerated: false,
    },
    {
      contractor: engNadiaCivil._id,
      title: 'إشراف هندسي عمارة سكنية بالغردقة',
      description: 'متابعة هندسية كاملة لمدة 5 أشهر لعمارة 4 أدوار.',
      projectType: 'new_construction',
      images: [DUMMY_FILE, DUMMY_FILE],
      beforePhotos: [DUMMY_FILE],
      afterPhotos: [DUMMY_FILE, DUMMY_FILE],
      sourceProject: p9._id,
      isAutoGenerated: true,
    },
    {
      contractor: elmasryConstruction._id,
      title: 'بناء عمارة سكنية 5 أدوار بالشروق',
      description: 'مشروع تسليم مفتاح كامل من الأساسات حتى التشطيبات.',
      projectType: 'new_construction',
      images: [DUMMY_FILE, DUMMY_FILE, DUMMY_FILE],
      isAutoGenerated: false,
    },
    {
      contractor: engKhaledArchitect._id,
      title: 'تصميم وتنفيذ فيلا حديثة بالشيخ زايد',
      description: 'تصميم معماري حديث مع تنفيذ كامل واستشارات الطاقة.',
      projectType: 'new_construction',
      images: [DUMMY_FILE, DUMMY_FILE, DUMMY_FILE],
      isAutoGenerated: false,
    },
  ]);

  // =============================================================
  // 12. PRODUCTS (B2B Material Market)
  // =============================================================
  console.log('🧱 Creating Products...');

  const products = await Product.create([
    {
      name: 'أسمنت أبيض - السويس - شيكارة 50 كجم',
      description: 'أسمنت أبيض عالي الجودة لأعمال المحارة والديكور.',
      category: 'cement',
      price: 280,
      unit: 'شيكارة',
      seller: elmasryConstruction._id,
      images: [DUMMY_FILE],
      stock: 500,
      status: 'active',
      governorate: 'القاهرة',
    },
    {
      name: 'حديد تسليح 16مم - عز - طن',
      description: 'حديد تسليح من شركة عز للحديد والصلب — مقاسات متعددة.',
      category: 'steel',
      price: 43500,
      unit: 'طن',
      seller: elmasryConstruction._id,
      images: [DUMMY_FILE],
      stock: 30,
      status: 'active',
      governorate: 'القاهرة',
    },
    {
      name: 'طوب أحمر مفرغ 25×12×6',
      description: 'طوب أحمر من أفران المنيا — تحمل عالٍ ومناسب للحوائط الحاملة.',
      category: 'bricks',
      price: 1.85,
      unit: 'طوبة',
      seller: rowadFoundation._id,
      images: [DUMMY_FILE],
      stock: 50000,
      status: 'active',
      governorate: 'المنيا',
    },
    {
      name: 'دهان جوتن بلاستيك مات - 9 لتر',
      description: 'دهان داخلي عالي الجودة من جوتن — تغطية ممتازة وقابل للغسل.',
      category: 'paint',
      price: 1350,
      unit: 'بستلة',
      seller: rowadFoundation._id,
      images: [DUMMY_FILE],
      stock: 80,
      status: 'active',
      governorate: 'القاهرة',
    },
    {
      name: 'بورسلين إسباني 60×60 لون رمادي',
      description: 'بورسلين مستورد من إسبانيا — لمعان عالي ومقاوم للخدش.',
      category: 'tiles',
      price: 320,
      unit: 'م²',
      seller: rowadFoundation._id,
      images: [DUMMY_FILE, DUMMY_FILE],
      stock: 1200,
      status: 'active',
      governorate: 'القاهرة',
    },
    {
      name: 'كابل نحاس 6مم - السويدي - رول 100م',
      description: 'كابل كهرباء معتمد من السويدي — مناسب لتأسيس المنازل.',
      category: 'electrical',
      price: 4800,
      unit: 'رول',
      seller: elmasryConstruction._id,
      images: [DUMMY_FILE],
      stock: 60,
      status: 'active',
      governorate: 'القاهرة',
    },
  ]);

  // =============================================================
  // 13. MATERIAL ORDERS
  // =============================================================
  console.log('📦 Creating Material Orders...');

  await MaterialOrder.create([
    {
      buyer: customerKarim._id,
      seller: products[3].seller,
      product: products[3]._id,
      quantity: 8,
      unitPrice: products[3].price,
      totalPrice: products[3].price * 8,
      status: 'delivered',
      buyerNotes: 'يرجى التوصيل صباحاً قبل العاشرة.',
      confirmedAt: daysAgo(12),
      deliveredAt: daysAgo(8),
    },
    {
      buyer: customerOmar._id,
      seller: products[4].seller,
      product: products[4]._id,
      quantity: 60,
      unitPrice: products[4].price,
      totalPrice: products[4].price * 60,
      status: 'shipped',
      buyerNotes: 'العنوان: مدينة نصر — شارع مكرم عبيد.',
      confirmedAt: daysAgo(3),
    },
  ]);

  // =============================================================
  // 14. PLATFORM SETTINGS — ensure defaults + sample terms
  // =============================================================
  console.log('⚙️  Seeding Platform Settings...');

  const sampleTerms = `الشروط والأحكام العامة لمنصة المقاول

أهلاً بك في منصة المقاول. باستخدامك للمنصة فإنك توافق على الالتزام بالشروط التالية:

1. التسجيل والحساب
- يجب أن تكون كل البيانات المقدمة عند التسجيل صحيحة وكاملة.
- المنصة تحتفظ بحق التحقق من الرقم القومي وأي مستندات إضافية للمقاولين.
- يُحظر مشاركة بيانات الحساب مع الغير.

2. نشر المشاريع وتقديم العروض
- العميل مسؤول عن دقة وصف المشروع والميزانية.
- المقاول مسؤول عن صحة العرض المقدم ومدى التزامه بالمدة والسعر.
- المنصة تتيح نظام Blind Bidding لضمان النزاهة بين المقاولين.

3. نظام الضمان (Escrow)
- يتم احتجاز المبلغ عبر المنصة لضمان حقوق الطرفين.
- يتم صرف الدفعات حسب المراحل المتفق عليها في العقد.
- في حالة النزاع، تتدخل إدارة المنصة للفصل وفقاً للأدلة المقدمة.

4. العمولات والرسوم
- المنصة تتقاضى عمولة 2% من قيمة العقود المُرسّاة.
- المقاولون يستخدمون نظام نقاط لتقديم العروض، ويمكن شحنه عبر المنصة.
- اشتراك Premium يمنح نقاط شهرية مجانية وعروض أولوية.

5. حماية البيانات والخصوصية
- المنصة لا تشارك بيانات الهوية الشخصية مع أطراف ثالثة.
- يتم تخزين الأرقام القومية وكلمات المرور بشكل مشفر.

6. النزاعات والتقييم
- التقييم بعد إغلاق المشروع متاح للعميل وتُحتسب نتيجته في تقييم المقاول العام.
- يمكن للعميل أو المقاول فتح نزاع، وتتولى إدارة المنصة الفصل خلال مدة لا تتجاوز 7 أيام عمل.

7. تعديل الشروط
تحتفظ منصة المقاول بحق تعديل هذه الشروط في أي وقت، وسيتم إخطار المستخدمين عبر البريد المسجل عند إجراء تعديلات جوهرية.

للاستفسارات: info@elmoquwal.com`;

  // Use the model statics so defaults stay accurate
  await PlatformSettings.setSetting('termsAndConditions', sampleTerms, superAdmin._id);
  await PlatformSettings.setSetting('termsLastUpdated', new Date().toISOString(), superAdmin._id);

  // =============================================================
  // SUMMARY
  // =============================================================
  console.log('\n✅ Seeding completed successfully!\n');
  console.log('────────────────────────────────────');
  console.log(`👥 Users:      ${await User.countDocuments()}`);
  console.log(`🏗️  Projects:   ${await Project.countDocuments()}`);
  console.log(`📜 Bids:       ${await Bid.countDocuments()}`);
  console.log(`📑 Contracts:  ${await Contract.countDocuments()}`);
  console.log(`🔒 Escrows:    ${await Escrow.countDocuments()}`);
  console.log(`🎨 Portfolio:  ${await PortfolioItem.countDocuments()}`);
  console.log(`💎 Subs:       ${await Subscription.countDocuments()}`);
  console.log(`🧱 Products:   ${await Product.countDocuments()}`);
  console.log(`📦 Orders:     ${await MaterialOrder.countDocuments()}`);
  console.log(`💳 Ledgers:    ${await CreditLedger.countDocuments()}`);
  console.log(`💰 Tx:         ${await Transaction.countDocuments()}`);
  console.log('────────────────────────────────────\n');
  console.log(`🔑 Shared password for all accounts: ${SHARED_PASSWORD}`);
}

seed()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Seeding failed:', err);
    return mongoose.disconnect().finally(() => process.exit(1));
  });
