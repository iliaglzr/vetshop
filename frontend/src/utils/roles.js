export const ROLES = {
  USER: 'user',
  PET_SHOP: 'pet_shop',
  PHARMACY: 'pharmacy',
  VACCINATION: 'vaccination',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  user: 'کاربر عادی',
  pet_shop: 'پت‌شاپ',
  pharmacy: 'داروخانه',
  vaccination: 'مرکز واکسیناسیون',
  admin: 'مدیر سیستم',
};

export function dashboardPath(role) {
  switch (role) {
    case ROLES.ADMIN: return '/admin';
    case ROLES.PET_SHOP: return '/dashboard/pet-shop';
    case ROLES.PHARMACY: return '/dashboard/pharmacy';
    case ROLES.VACCINATION: return '/dashboard/vaccination';
    default: return '/dashboard';
  }
}
