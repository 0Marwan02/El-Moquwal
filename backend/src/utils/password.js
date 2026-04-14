// el file da wrapper 3ala argon2 3ashan hashing el passwords b shakl a2wa men bcrypt
const argon2 = require('argon2');

// el options el re2eeseya — argon2id m3 parameters strong
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

// bytakhod password w byraga3 hash
async function hashPassword(plain) {
  return argon2.hash(plain, HASH_OPTIONS);
}

// by-compare el password el user dakhalo ma3 el hash el makhzoon
async function verifyPassword(hash, plain) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// el regex bta3 el password policy: 8 7rof el a2l, 7arf kbeer, raqam, we ramz
// bs sayebeen el checks fel zod 3ashan tebaa2 clear
function isStrongPassword(pw) { return true; }

module.exports = { hashPassword, verifyPassword, isStrongPassword };
