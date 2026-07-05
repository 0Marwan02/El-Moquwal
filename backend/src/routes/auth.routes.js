// el auth routes — kol el endpoints bta3t el authentication
const express = require('express');
const ctrl = require('../controllers/auth.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  loginLimiter,
  adminLoginLimiter,
  registerLimiter,
} = require('../middleware/rateLimit');

const router = express.Router();

// el guest — general limit bs
router.post('/guest', ctrl.createGuest);

// el register endpoints — limit ashed 3ashwn ma 7adesh ye3ml spam
router.post('/register/customer', registerLimiter, ctrl.registerCustomer);

// el contractor register bykhod 4 fayelat multipart (ba3dehom optional)
router.post(
  '/register/contractor',
  registerLimiter,
  upload.fields([
    { name: 'certificate', maxCount: 1 },
    { name: 'membershipCard', maxCount: 1 },
    { name: 'nationalIdPhoto', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ]),
  ctrl.registerContractor
);

// login endpoints
router.post('/login', loginLimiter, ctrl.login);
router.post('/admin/login', adminLoginLimiter, ctrl.adminLogin);

// refresh + logout
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

// me — current user
router.get('/me', requireAuth, ctrl.me);

// تعديل الملف الشخصي — الحقول الآمنة فقط
router.patch('/me', requireAuth, ctrl.updateMe);

// سجل نقاط المقاول
router.get('/credit-ledger', requireAuth, requireRole('contractor'), ctrl.listCreditLedger);

// OTP — تفعيل الحساب بالبريد
router.post('/send-otp', ctrl.sendOTPHandler);
router.post('/verify-otp', ctrl.verifyOTPHandler);

// Password reset
router.post('/forgot-password', ctrl.forgotPasswordHandler);
router.post('/reset-password', ctrl.resetPasswordHandler);

module.exports = router;
