/**
 * Constants for the Finance PWA application
 * Includes icon mappings, default values, and configuration
 */

import {
  ShoppingCart,
  Briefcase,
  Home,
  Coffee,
  CreditCard,
  Store,
  Car,
  Utensils,
  Phone,
  Heart,
  PawPrint,
  Tv,
  Gift,
  Shirt,
  Users,
  Sofa,
  Scissors,
  Receipt,
  Wallet,
  Banknote,
  Building2,
  Smartphone,
  PiggyBank,
  ArrowRightLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// CATEGORY ICON MAPPING
// ============================================

/**
 * Maps icon_slug from database to Lucide React icon component
 * Used to render category icons dynamically
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Parent categories
  'shopping-cart': ShoppingCart,
  'briefcase': Briefcase,
  'home': Home,
  'coffee': Coffee,
  'credit-card': CreditCard,
  
  // Child categories - Super & Alimentos
  'store': Store,
  'supermarket': ShoppingCart,
  
  // Child categories - Trabajo & Transporte
  'car': Car,
  'bus': Car,
  
  // Child categories - Casa & Servicios
  'utensils': Utensils,
  'phone': Phone,
  'heart': Heart,
  'paw-print': PawPrint,
  'tv': Tv,
  
  // Child categories - Extras & Hormiga
  'gift': Gift,
  'shirt': Shirt,
  'users': Users,
  'sofa': Sofa,
  'scissors': Scissors,
  'user': Users,
  
  // Child categories - Deudas & Bancos
  'receipt': Receipt,
  'wallet': Wallet,
  'banknote': Banknote,
  'building': Building2,
};

/**
 * Default icon for categories without a mapped icon_slug
 */
export const DEFAULT_CATEGORY_ICON = Wallet;

/**
 * Get icon component by slug
 * @param slug - The icon_slug from the database
 * @returns Lucide icon component
 */
export function getCategoryIcon(slug: string | null): LucideIcon {
  if (!slug) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICONS[slug] || DEFAULT_CATEGORY_ICON;
}

// ============================================
// ACCOUNT TYPE CONFIGURATION
// ============================================


/**
 * Account type display configuration
 */
export const ACCOUNT_TYPE_CONFIG: Record<string, {
  label: string;
  labelPlural: string;
  icon: LucideIcon;
  color: string;
}> = {
  banco: {
    label: 'Banco',
    labelPlural: 'Bancos',
    icon: Building2,
    color: 'text-blue-600',
  },
  billetera_virtual: {
    label: 'Billetera Virtual',
    labelPlural: 'Billeteras Virtuales',
    icon: Smartphone,
    color: 'text-purple-600',
  },
  efectivo: {
    label: 'Efectivo',
    labelPlural: 'Efectivo',
    icon: Banknote,
    color: 'text-green-600',
  },
  tarjeta_credito: {
    label: 'Tarjeta de Crédito',
    labelPlural: 'Tarjetas de Crédito',
    icon: CreditCard,
    color: 'text-orange-600',
  },
  deuda_fiado: {
    label: 'Deuda/Fiado',
    labelPlural: 'Deudas y Fiados',
    icon: PiggyBank,
    color: 'text-red-600',
  },
};

/**
 * Get account type configuration
 * @param type - Account type
 * @returns Configuration object with label, icon, and color
 */
export function getAccountTypeConfig(type: string) {
  return ACCOUNT_TYPE_CONFIG[type] || {
    label: type,
    labelPlural: type,
    icon: Wallet,
    color: 'text-gray-600',
  };
}

// ============================================
// PAYMENT METHOD CONFIGURATION
// ============================================

/**
 * Payment method display configuration
 */
export const PAYMENT_METHOD_CONFIG: Record<string, {
  label: string;
  icon: LucideIcon;
  description: string;
}> = {
  transferencia: {
    label: 'Transferencia',
    icon: Building2,
    description: 'Transferencia bancaria',
  },
  qr: {
    label: 'QR',
    icon: Smartphone,
    description: 'Pago con código QR',
  },
  debito: {
    label: 'Débito',
    icon: CreditCard,
    description: 'Tarjeta de débito',
  },
  debito_automatico: {
    label: 'Débito Automático',
    icon: Receipt,
    description: 'Débito automático programado',
  },
  credito: {
    label: 'Crédito',
    icon: CreditCard,
    description: 'Tarjeta de crédito',
  },
  descubierto: {
    label: 'Descubierto',
    icon: PiggyBank,
    description: 'Giro en descubierto',
  },
  efectivo: {
    label: 'Efectivo',
    icon: Banknote,
    description: 'Pago en efectivo',
  },
  fiado_adrian: {
    label: 'Fiado Adrián',
    icon: Wallet,
    description: 'Cuenta corriente con Adrián',
  },
};

/**
 * Get payment method configuration
 * @param method - Payment method
 * @returns Configuration object with label, icon, and description
 */
export function getPaymentMethodConfig(method: string) {
  return PAYMENT_METHOD_CONFIG[method] || {
    label: method,
    icon: Wallet,
    description: '',
  };
}

// ============================================
// TRANSACTION TYPE CONFIGURATION
// ============================================

/**
 * Transaction type display configuration
 */
export const TRANSACTION_TYPE_CONFIG: Record<string, {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}> = {
  gasto: {
    label: 'Gasto',
    icon: TrendingDown,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  ingreso: {
    label: 'Ingreso',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  transferencia_interna: {
    label: 'Transferencia',
    icon: ArrowRightLeft,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
};

/**
 * Get transaction type configuration
 * @param type - Transaction type
 * @returns Configuration object with label, icon, and colors
 */
export function getTransactionTypeConfig(type: string) {
  return TRANSACTION_TYPE_CONFIG[type] || {
    label: type,
    icon: Wallet,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  };
}

// ============================================
// TRAFFIC LIGHT CONFIGURATION
// ============================================

/**
 * Traffic light tag configuration (Economía de Guerra)
 */
export const TRAFFIC_LIGHT_CONFIG: Record<string, {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
}> = {
  inevitable: {
    label: 'Inevitable',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Gastos necesarios e impostergables',
  },
  optimizable: {
    label: 'Optimizable',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'Gastos que pueden reducirse',
  },
  evitable: {
    label: 'Evitable',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Gastos prescindibles',
  },
};

/**
 * Get traffic light configuration
 * @param tag - Traffic light tag
 * @returns Configuration object with label, icon, colors, and description
 */
export function getTrafficLightConfig(tag: string | null) {
  if (!tag) return null;
  return TRAFFIC_LIGHT_CONFIG[tag] || null;
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Date format options for display
 */
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

export const DATE_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

export const DATE_FORMAT_MONTH: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
};

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Currency format configuration for Argentine Peso
 */
export const CURRENCY_CONFIG = {
  locale: 'es-AR',
  currency: 'ARS',
};

/**
 * Format amount as currency
 * @param amount - Numeric amount
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    style: 'currency',
    currency: CURRENCY_CONFIG.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// PAGINATION DEFAULTS
// ============================================

/**
 * Default pagination settings
 */
export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
};

// ============================================
// CATEGORY NAMES (for reference/validation)
// ============================================

/**
 * Parent category names as defined in the database
 */
export const PARENT_CATEGORIES = {
  SUPER_ALIMENTOS: 'Súper & Alimentos',
  TRABAJO_TRANSPORTE: 'Trabajo & Transporte',
  CASA_SERVICIOS: 'Casa & Servicios',
  EXTRAS_HORMIGA: 'Extras & Hormiga',
  DEUDAS_BANCOS: 'Deudas & Bancos',
} as const;

/**
 * Child categories grouped by parent
 */
export const CHILD_CATEGORIES: Record<string, string[]> = {
  [PARENT_CATEGORIES.SUPER_ALIMENTOS]: [
    'Supermercado (Grande)',
    'Almacén (Barrio)',
    'Carnicería',
    'Verdulería',
    'Perfumería & Limpieza',
  ],
  [PARENT_CATEGORIES.TRABAJO_TRANSPORTE]: [
    'Viáticos / SUBE',
    'Material Didáctico',
    'Comida Laboral (Salud/Necesidad)',
  ],
  [PARENT_CATEGORIES.CASA_SERVICIOS]: [
    'Impuestos y Servicios',
    'Telefonía / Internet',
    'Farmacia y Salud',
    'Mascotas',
    'Streaming (Netflix/Disney/etc)',
  ],
  [PARENT_CATEGORIES.EXTRAS_HORMIGA]: [
    'Kiosco / Golosinas',
    'Comida / Salidas (Placer)',
    'Vestimenta y Calzado',
    'Eventos Sociales',
    'Hogar / Deco / Blanquería',
    'Belleza (Peluquería/Uñas/Pies)',
  ],
  [PARENT_CATEGORIES.DEUDAS_BANCOS]: [
    'Pago a Adrián (Saldo Mensual)',
    'Pago Tarjeta Crédito',
    'Intereses / Mantenimiento',
  ],
};
