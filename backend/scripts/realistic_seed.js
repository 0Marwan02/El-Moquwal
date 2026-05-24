const mongoose = require('mongoose');
const argon2 = require('argon2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const AdminProfile = require('../src/models/AdminProfile');
const CustomerProfile = require('../src/models/CustomerProfile');
const ContractorProfile = require('../src/models/ContractorProfile');
const Project = require('../src/models/Project');
const Bid = require('../src/models/Bid');
const CreditLedger = require('../src/models/CreditLedger');

const { connectDB } = require('../src/config/db');

const crypto = require('crypto');
const SuperAdminProfile = require('../src/models/SuperAdminProfile');

// helper for hashing NID to match auth controller
function hashNID(nid) {
  return crypto.createHash('sha256').update(nid).digest('hex');
}

const DUMMY_FILE = {
  filename: 'dummy_photo.jpg',
  originalName: 'photo.jpg',
  mimetype: 'image/jpeg',
  size: 102400,
  uploadedAt: new Date()
};

async function seed() {
  try {
    console.log('🔌 Connecting to DB...');
    await connectDB();

    console.log('🧹 Clearing old data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Bid.deleteMany({});
    await CreditLedger.deleteMany({});

    const password = '123456ABC';
    const passwordHash = await argon2.hash(password);

    console.log('👤 Creating Admins...');
    const superAdmin = await SuperAdminProfile.create({
      name: 'المدير الرئيسي',
      email: 'super@elmoquwal.com',
      phone: '01000000000',
      passwordHash,
      role: 'super_admin',
      status: 'active',
      nationalIdHash: hashNID('29001011234500'),
      nationalIdLast4: '4500',
      dob: new Date('1990-01-01'),
      gender: 'male',
      governorateCode: '01',
      governorate: 'القاهرة',
    });

    const admin = await AdminProfile.create({
      name: 'أحمد المراجع',
      email: 'admin@elmoquwal.com',
      phone: '01011112222',
      passwordHash,
      role: 'admin',
      status: 'active',
      nationalIdHash: hashNID('29001011234567'),
      nationalIdLast4: '4567',
      dob: new Date('1992-01-01'),
      gender: 'male',
      governorateCode: '01',
      governorate: 'القاهرة',
      permissions: ['review_contractors', 'view_projects', 'view_stats', 'manage_disputes'],
      createdBySuperAdmin: superAdmin._id,
    });

    console.log('👤 Creating Customers...');
    const customer1 = await CustomerProfile.create({
      name: 'أحمد محمود',
      email: 'ahmed@customer.com',
      phone: '01122334455',
      passwordHash,
      role: 'customer',
      status: 'active',
      nationalIdHash: hashNID('29202021234567'),
      nationalIdLast4: '4567',
      dob: new Date('1992-02-02'),
      gender: 'male',
      governorateCode: '01',
      governorate: 'القاهرة'
    });

    const customer2 = await CustomerProfile.create({
      name: 'سارة إبراهيم',
      email: 'sara@customer.com',
      phone: '01233445566',
      passwordHash,
      role: 'customer',
      status: 'active',
      nationalIdHash: hashNID('29403031234567'),
      nationalIdLast4: '4567',
      dob: new Date('1994-03-03'),
      gender: 'female',
      governorateCode: '02',
      governorate: 'الإسكندرية'
    });

    console.log('👤 Creating Contractors...');
    const contractor1 = await ContractorProfile.create({
      name: 'مؤسسة الرواد للتشطيبات',
      email: 'info@rowad.com',
      phone: '01555667788',
      passwordHash,
      role: 'contractor',
      status: 'active',
      nationalIdHash: hashNID('28504041234567'),
      nationalIdLast4: '4567',
      dob: new Date('1985-04-04'),
      gender: 'male',
      governorateCode: '01',
      governorate: 'القاهرة',
      specialty: 'finishing',
      yearsOfExperience: 10,
      bio: 'متخصصون في تشطيبات الفلل والشقق الفاخرة',
      nationalIdPhoto: DUMMY_FILE,
      approvedBy: admin._id,
      approvedAt: new Date(),
      creditBalance: 15, // رصيد ابتدائي
      rating: 4.8,
      completedProjects: 1
    });

    const contractor2 = await ContractorProfile.create({
      name: 'عصام للسباكة',
      email: 'essam@plumber.com',
      phone: '01099887766',
      passwordHash,
      role: 'contractor',
      status: 'active',
      nationalIdHash: hashNID('28805051234567'),
      nationalIdLast4: '4567',
      dob: new Date('1988-05-05'),
      gender: 'male',
      governorateCode: '21',
      governorate: 'الجيزة',
      specialty: 'plumber',
      yearsOfExperience: 5,
      nationalIdPhoto: DUMMY_FILE,
      approvedBy: admin._id,
      approvedAt: new Date(),
      creditBalance: 10,
      rating: 0,
      completedProjects: 0
    });

    const contractor3 = await ContractorProfile.create({
      name: 'مهندس مصطفى',
      email: 'mostafa@pending.com',
      phone: '01199998888',
      passwordHash,
      role: 'contractor',
      status: 'pending',
      nationalIdHash: hashNID('29606061234567'),
      nationalIdLast4: '4567',
      dob: new Date('1996-06-06'),
      gender: 'male',
      governorateCode: '02',
      governorate: 'الإسكندرية',
      specialty: 'civil_engineer',
      yearsOfExperience: 7,
      nationalIdPhoto: DUMMY_FILE,
      creditBalance: 5
    });

    console.log('💳 Creating Credit Ledgers...');
    await CreditLedger.create([
      {
        user: contractor1._id,
        delta: 15,
        reason: 'signup_grant',
        balanceAfter: 15,
        meta: 'Initial seed'
      },
      {
        user: contractor2._id,
        delta: 10,
        reason: 'signup_grant',
        balanceAfter: 10,
        meta: 'Initial seed'
      },
      {
        user: contractor3._id,
        delta: 5,
        reason: 'signup_grant',
        balanceAfter: 5,
        meta: 'Initial seed'
      }
    ]);

    console.log('🏗️ Creating Projects...');
    
    // Project 1: Open, Finishing
    const p1 = await Project.create({
      title: 'تشطيب شقة 180 متر في التجمع',
      description: 'نحتاج لتشطيب سوبر لوكس لشقة 180 متر تشمل أعمال السباكة والكهرباء والدهانات.',
      projectType: 'finishing',
      propertyDetails: {
        governorate: 'القاهرة',
        district: 'التجمع الخامس',
        area: 180,
        floors: 1,
        rooms: 3,
        bathrooms: 2,
        gpsCoords: { lat: 30.0123, lng: 31.4123 }
      },
      requirements: { 'بلاط': 'بورسلين', 'دهان': 'جوتن' },
      budgetRange: '500k_1m',
      timeline: '3_6_months',
      postedBy: customer1._id,
      status: 'open',
      bidsCount: 2,
      aiEstimatedPrice: { minEstimate: 600000, maxEstimate: 850000, currency: 'EGP', estimatedAt: new Date(), model: 'Qwen' }
    });

    // Project 2: Open, Plumbing
    const p2 = await Project.create({
      title: 'إصلاح تسريب مياه في الحمام',
      description: 'يوجد تسريب مياه من سقف الحمام ونحتاج سباك ممتاز للكشف والإصلاح.',
      projectType: 'plumbing',
      propertyDetails: {
        governorate: 'الجيزة',
        district: 'الشيخ زايد',
        area: 15,
        floors: 1,
        bathrooms: 1
      },
      budgetRange: 'under_50k',
      timeline: 'within_week',
      postedBy: customer2._id,
      status: 'open',
      bidsCount: 1
    });

    // Project 3: Draft
    await Project.create({
      title: 'بناء فيلا الساحل',
      description: 'مسودة لمشروع فيلا في الساحل الشمالي.',
      projectType: 'new_construction',
      propertyDetails: {
        governorate: 'مطروح',
        district: 'العلمين',
        area: 400,
        floors: 2
      },
      budgetRange: 'above_1m',
      postedBy: customer1._id,
      status: 'draft'
    });

    // Project 4: Awarded
    const p4 = await Project.create({
      title: 'تجديد مكتب عمل',
      description: 'تجديد مكتب 100 متر في المهندسين.',
      projectType: 'renovation',
      propertyDetails: {
        governorate: 'الجيزة',
        district: 'المهندسين',
        area: 100,
        rooms: 4
      },
      budgetRange: '200k_500k',
      postedBy: customer2._id,
      status: 'awarded',
      bidsCount: 2,
      awardedTo: contractor1._id
    });

    // Project 5: Closed
    const p5 = await Project.create({
      title: 'تشطيب صيدلية',
      description: 'تشطيب صيدلية كاملة في مدينة نصر',
      projectType: 'finishing',
      propertyDetails: {
        governorate: 'القاهرة',
        district: 'مدينة نصر',
        area: 60
      },
      budgetRange: '50k_200k',
      postedBy: customer1._id,
      status: 'closed',
      bidsCount: 1,
      awardedTo: contractor1._id,
      closedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      clientRating: 4.8,
      clientReview: 'شغل ممتاز جدا ومواعيد دقيقة'
    });

    console.log('📜 Creating Bids...');

    // Bids for P1 (Open)
    await Bid.create({
      project: p1._id,
      contractor: contractor1._id,
      amount: 750000,
      message: 'يمكننا القيام بالمشروع بأعلى جودة. لدينا سابقة أعمال في التجمع.',
      proposedDurationDays: 120,
      status: 'pending'
    });
    await CreditLedger.create({ user: contractor1._id, delta: -1, reason: 'bid_submit', balanceAfter: 14, project: p1._id });

    await Bid.create({
      project: p1._id,
      contractor: contractor2._id,
      amount: 600000,
      message: 'سأقوم بأعمال السباكة فقط بأفضل سعر.',
      proposedDurationDays: 30,
      status: 'pending'
    });
    await CreditLedger.create({ user: contractor2._id, delta: -1, reason: 'bid_submit', balanceAfter: 9, project: p1._id });

    // Bids for P2 (Open)
    await Bid.create({
      project: p2._id,
      contractor: contractor2._id,
      amount: 2500,
      message: 'أنا سباك في الشيخ زايد ومستعد للبدء فورا.',
      proposedDurationDays: 2,
      status: 'pending'
    });
    await CreditLedger.create({ user: contractor2._id, delta: -1, reason: 'bid_submit', balanceAfter: 8, project: p2._id });

    // Bids for P4 (Awarded)
    const b4a = await Bid.create({
      project: p4._id,
      contractor: contractor1._id,
      amount: 280000,
      message: 'عرض تجديد المكتب شامل الخامات.',
      proposedDurationDays: 45,
      status: 'accepted',
      respondedAt: new Date()
    });
    p4.awardedBidId = b4a._id;
    await p4.save();

    await Bid.create({
      project: p4._id,
      contractor: contractor2._id,
      amount: 320000,
      message: 'عرض آخر.',
      proposedDurationDays: 60,
      status: 'rejected',
      respondedAt: new Date()
    });

    // Bids for P5 (Closed)
    const b5 = await Bid.create({
      project: p5._id,
      contractor: contractor1._id,
      amount: 150000,
      message: 'تشطيب الصيدلية بمعايير وزارة الصحة.',
      proposedDurationDays: 20,
      status: 'accepted',
      respondedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    });
    p5.awardedBidId = b5._id;
    await p5.save();

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
