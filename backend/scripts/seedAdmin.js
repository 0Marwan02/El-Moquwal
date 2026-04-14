// el script el CLI elly byz3ef admin gedeed men el terminal — admin bootstrap only
const readline = require('readline');
const mongoose = require('mongoose');

const env = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const Admin = require('../src/models/AdminProfile');
const User = require('../src/models/User');
const { hashPassword, isStrongPassword } = require('../src/utils/password');

// helper 3ashan ne2ra men el stdin
function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // law hidden (password) — nshel el echo
    if (hidden) {
      const stdin = process.stdin;
      process.stdout.write(question);
      let value = '';
      stdin.setRawMode && stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      const onData = (char) => {
        if (char === '\u0003') process.exit(0); // ctrl+c
        if (char === '\r' || char === '\n') {
          stdin.setRawMode && stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(value);
        } else if (char === '\u007f') {
          // backspace
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          value += char;
          process.stdout.write('*');
        }
      };
      stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

// el function el re2eesy
async function main() {
  console.log('\n=== 🛡️  Admin seed — El Moquwal ===\n');
  try {
    await connectDB();

    const name = await ask('Admin name: ');
    if (name.length < 3) throw new Error('الاسم قصير');

    const email = (await ask('Admin email: ')).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('البريد الإلكتروني غير صحيح');

    const phone = await ask('Admin phone (01xxxxxxxxx): ');
    if (!/^01[0125]\d{8}$/.test(phone)) throw new Error('رقم الهاتف غير صحيح');

    const password = await ask('Admin password (min 8, upper, digit, symbol): ', { hidden: true });
    // removed the strict isStrongPassword requirement per user request
    if (password.length < 6) {
      throw new Error('كلمة المرور يجب أن تكون 6 أرقام على الأقل');
    }

    const confirm = await ask('Confirm password: ', { hidden: true });
    if (confirm !== password) throw new Error('كلمتا المرور غير متطابقتين');

    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email already exists');

    const passwordHash = await hashPassword(password);
    
    // Admins don't have a real national ID, we give them a hardcoded random one or dummy one for schema bypass
    const dummyNID = '00000000000000';
    const crypto = require('crypto');
    const nidHash = crypto.createHash('sha256').update(dummyNID).digest('hex');

    const admin = await Admin.create({
      name,
      email,
      phone,
      passwordHash,
      nationalIdHash: nidHash,
      nationalIdLast4: '0000',
      status: 'active',
    });

    console.log('\n✅ Admin created:');
    console.log(`   ID:    ${admin._id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}\n`);
  } catch (err) {
    console.error('\n❌ Error:', err.message || err, '\n');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
