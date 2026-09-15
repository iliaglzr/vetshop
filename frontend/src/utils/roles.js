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

export const ROLE_DASHBOARDS = {
  user: '/dashboard',
  pet_shop: '/dashboard/pet-shop',
  pharmacy: '/dashboard/pharmacy',
  vaccination: '/dashboard/vaccination',
  admin: '/admin',
};

export const ROLE_PRODUCT_ACCESS = {
  user: ['مکمل‌ها', 'تجهیزات'],

  pet_shop: [
    'مکمل‌ها',
    'تجهیزات',
  ],

  pharmacy: [
    'داروها',
    'مکمل‌ها',
    'تجهیزات',
  ],

  vaccination: [
    'واکسن‌ها',
    'تجهیزات',
  ],

  admin: [
    'داروها',
    'مکمل‌ها',
    'تجهیزات',
    'واکسن‌ها',
  ],
};

export function dashboardPath(role) {
  return ROLE_DASHBOARDS[role] || '/dashboard';
}

export function hasRole(user, roles = []) {
  if (!user) return false;

  if (!roles.length) {
    return true;
  }

  return roles.includes(user.role);
}

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}