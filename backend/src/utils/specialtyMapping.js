// ربط تخصص المقاول بأنواع المشاريع المناسبة
const SPECIALTY_TO_PROJECT_TYPES = {
  electrical: ['electrical', 'repair', 'renovation'],
  plumber: ['plumbing', 'repair', 'renovation'],
  painter: ['finishing', 'renovation', 'repair'],
  finishing: ['finishing', 'renovation'],
  carpenter: ['finishing', 'renovation', 'repair'],
  civil_engineer: ['new_construction', 'renovation', 'extension', 'demolition', 'finishing'],
  architect: ['new_construction', 'extension', 'finishing', 'renovation'],
  general_contractor: null, // null = كل الأنواع
  other: null,
};

const SPECIALTY_LABELS = {
  civil_engineer: 'مهندس مدني',
  architect: 'مهندس معماري',
  electrical: 'فني كهرباء',
  plumber: 'سباك',
  carpenter: 'نجار',
  painter: 'نقاش',
  general_contractor: 'مقاول عام',
  finishing: 'تشطيبات',
  other: 'أخرى',
};

function getProjectTypesForSpecialty(specialty) {
  if (!specialty) return null;
  return SPECIALTY_TO_PROJECT_TYPES[specialty] ?? null;
}

function projectMatchesSpecialty(projectType, specialty) {
  const types = getProjectTypesForSpecialty(specialty);
  if (!types) return true;
  return types.includes(projectType);
}

module.exports = {
  SPECIALTY_TO_PROJECT_TYPES,
  SPECIALTY_LABELS,
  getProjectTypesForSpecialty,
  projectMatchesSpecialty,
};
