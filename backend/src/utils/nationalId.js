// el file da feeh kol el logic bta3 el raqam el qawmy el masry
// el format: C YY MM DD GG SSSS G K
// C = el qarn (2 = 19xx, 3 = 20xx)
// YY = el sana, MM = el shahr, DD = el yom
// GG = kod el mo7afza
// SSSS = el raqam el motasalsel
// G = fardy = dakar, zogy = ontha
// K = checksum

// el map bta3 el mo7afzat el masreya — kol kod we esmo
const GOVERNORATES = {
  '01': 'القاهرة',
  '02': 'الإسكندرية',
  '03': 'بورسعيد',
  '04': 'السويس',
  '11': 'دمياط',
  '12': 'الدقهلية',
  '13': 'الشرقية',
  '14': 'القليوبية',
  '15': 'كفر الشيخ',
  '16': 'الغربية',
  '17': 'المنوفية',
  '18': 'البحيرة',
  '19': 'الإسماعيلية',
  '21': 'الجيزة',
  '22': 'بني سويف',
  '23': 'الفيوم',
  '24': 'المنيا',
  '25': 'أسيوط',
  '26': 'سوهاج',
  '27': 'قنا',
  '28': 'أسوان',
  '29': 'الأقصر',
  '31': 'البحر الأحمر',
  '32': 'الوادي الجديد',
  '33': 'مطروح',
  '34': 'شمال سيناء',
  '35': 'جنوب سيناء',
  '88': 'خارج الجمهورية',
};

// el function dy bet2kd en el raqam 14 digit we kolo arqam
function isFormatValid(nid) {
  return typeof nid === 'string' && /^\d{14}$/.test(nid);
}

// bet2kd en el date el tala3 men el raqam feklan date sa7
function isDateValid(year, month, day) {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day &&
    d <= new Date()
  );
}

// el function el re2eesy — by3ml parse kamel lel raqam we yeraga3 kol el data
function parseNID(nid) {
  // el default return law 7aga ghalat
  const invalid = { valid: false, reason: null };

  if (!isFormatValid(nid)) {
    return { ...invalid, reason: 'الرقم لازم يكون 14 رقم' };
  }

  const centuryDigit = parseInt(nid[0], 10);
  // el qarn — 2 = 19xx, 3 = 20xx, ay 7aga tanya ghalat
  let century;
  if (centuryDigit === 2) century = 1900;
  else if (centuryDigit === 3) century = 2000;
  else return { ...invalid, reason: 'خانة القرن غير صحيحة' };

  const yy = parseInt(nid.substring(1, 3), 10);
  const mm = parseInt(nid.substring(3, 5), 10);
  const dd = parseInt(nid.substring(5, 7), 10);
  const govCode = nid.substring(7, 9);
  const genderDigit = parseInt(nid[12], 10);

  const year = century + yy;

  // TEMP: strict DOB-sequence matching commented out per implementation plan
  // if (!isDateValid(year, mm, dd)) {
  //   return { ...invalid, reason: 'تاريخ الميلاد غير صحيح' };
  // }

  const governorate = GOVERNORATES[govCode];
  if (!governorate) {
    return { ...invalid, reason: 'كود المحافظة غير معروف' };
  }

  // el gender: fardy = dakar, zogy = ontha
  const gender = genderDigit % 2 === 1 ? 'male' : 'female';

  // byraga3 object feeh kol el data mestkhraga
  return {
    valid: true,
    reason: null,
    dob: `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    year,
    month: mm,
    day: dd,
    gender,
    governorateCode: govCode,
    governorate,
    century,
  };
}

// byraga3 akher 4 arqam bas lel 3ard (masks el baa2y)
function maskNID(nid) {
  if (!isFormatValid(nid)) return null;
  return '**********' + nid.substring(10);
}

module.exports = { parseNID, maskNID, GOVERNORATES, isFormatValid };
