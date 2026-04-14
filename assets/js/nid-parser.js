/* ============================================================
   nid-parser.js — el helper el moshtarak lel raqam el qawmy el masry
   bye3ml parse + validation we bytela3 el dob + gender + mo7afza
   ============================================================ */

// el map bta3 el mo7afzat — kod we esm 3arby
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
  '88': 'خارج الجمهورية'
};

// el shohour el 3arbeya lel 3ard
const MONTHS_AR = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// byshoof law el date el tala3 real wala la2
function isDateValid(year, month, day) {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day &&
    d <= new Date()
  );
}

// el function el re2eesy — by3ml parse kamel
function parseNID(nid) {
  // default invalid
  const invalid = (reason) => ({ valid: false, reason });

  // lazem string 14 raqam bel zabt
  if (typeof nid !== 'string' || !/^\d{14}$/.test(nid)) {
    return invalid('الرقم القومي لازم يكون 14 رقم');
  }

  const centuryDigit = parseInt(nid[0], 10);
  let century;
  if (centuryDigit === 2) century = 1900;
  else if (centuryDigit === 3) century = 2000;
  else return invalid('خانة القرن غير صحيحة');

  const yy = parseInt(nid.substring(1, 3), 10);
  const mm = parseInt(nid.substring(3, 5), 10);
  const dd = parseInt(nid.substring(5, 7), 10);
  const govCode = nid.substring(7, 9);
  const genderDigit = parseInt(nid[12], 10);

  const year = century + yy;

  if (!isDateValid(year, mm, dd)) {
    return invalid('تاريخ الميلاد غير صحيح');
  }

  const governorate = GOVERNORATES[govCode];
  if (!governorate) {
    return invalid('كود المحافظة غير معروف');
  }

  // fardy = dakar, zogy = ontha
  const gender = genderDigit % 2 === 1 ? 'male' : 'female';
  const genderAr = gender === 'male' ? 'ذكر' : 'أنثى';

  // string mnasaq lel 3ard
  const dobDisplay = `${dd} ${MONTHS_AR[mm]} ${year}`;

  return {
    valid: true,
    reason: null,
    dob: `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    dobDisplay,
    year,
    month: mm,
    day: dd,
    gender,
    genderAr,
    governorateCode: govCode,
    governorate,
    century
  };
}

// byexport lel window lel use fel HTML
window.NIDParser = { parseNID, GOVERNORATES };
