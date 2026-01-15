export const PLAN_TYPES = {
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES]

export const PLAN_FEATURES = {
  // Basic features (all plans)
  STUDENT_MANAGEMENT: 'student_management',
  ATTENDANCE_TRACKING: 'attendance_tracking',
  FEE_MANAGEMENT: 'fee_management',
  EXAM_MANAGEMENT: 'exam_management',
  BASIC_REPORTS: 'basic_reports',
  EMAIL_SUPPORT: 'email_support',
  WHATSAPP_INTEGRATION: 'whatsapp_integration',

  // Professional+ features
  CUSTOM_REPORTS: 'custom_reports',
  PRIORITY_SUPPORT: 'priority_support',
  WEEKLY_BACKUPS: 'weekly_backups',

  // Enterprise only features
  API_ACCESS: 'api_access',
  MULTI_BRANCH: 'multi_branch',
  DEDICATED_SUPPORT: 'dedicated_support',
  CUSTOM_DEVELOPMENT: 'custom_development',
  DAILY_BACKUPS: 'daily_backups',
} as const

export type PlanFeature = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES]

export interface PlanConfig {
  id: PlanType
  name: string
  description: string
  price: number  // Price per student
  maxStudents: number | null  // null = unlimited
  maxAdminUsers: number | null  // null = unlimited
  features: PlanFeature[]
}

export const PLANS: Record<PlanType, PlanConfig> = {
  [PLAN_TYPES.STARTER]: {
    id: 'starter',
    name: 'Starter',
    description: 'Best for small schools',
    price: 50,
    maxStudents: 300,
    maxAdminUsers: 5,
    features: [
      PLAN_FEATURES.STUDENT_MANAGEMENT,
      PLAN_FEATURES.ATTENDANCE_TRACKING,
      PLAN_FEATURES.FEE_MANAGEMENT,
      PLAN_FEATURES.EXAM_MANAGEMENT,
      PLAN_FEATURES.BASIC_REPORTS,
      PLAN_FEATURES.EMAIL_SUPPORT,
      PLAN_FEATURES.WHATSAPP_INTEGRATION,
    ],
  },
  [PLAN_TYPES.PROFESSIONAL]: {
    id: 'professional',
    name: 'Professional',
    description: 'Best for medium schools',
    price: 100,
    maxStudents: 1000,
    maxAdminUsers: 15,
    features: [
      PLAN_FEATURES.STUDENT_MANAGEMENT,
      PLAN_FEATURES.ATTENDANCE_TRACKING,
      PLAN_FEATURES.FEE_MANAGEMENT,
      PLAN_FEATURES.EXAM_MANAGEMENT,
      PLAN_FEATURES.BASIC_REPORTS,
      PLAN_FEATURES.EMAIL_SUPPORT,
      PLAN_FEATURES.WHATSAPP_INTEGRATION,
      PLAN_FEATURES.CUSTOM_REPORTS,
      PLAN_FEATURES.PRIORITY_SUPPORT,
      PLAN_FEATURES.WEEKLY_BACKUPS,
    ],
  },
  [PLAN_TYPES.ENTERPRISE]: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Best for large institutions',
    price: 0, // Custom pricing
    maxStudents: null, // Unlimited
    maxAdminUsers: null, // Unlimited
    features: [
      PLAN_FEATURES.STUDENT_MANAGEMENT,
      PLAN_FEATURES.ATTENDANCE_TRACKING,
      PLAN_FEATURES.FEE_MANAGEMENT,
      PLAN_FEATURES.EXAM_MANAGEMENT,
      PLAN_FEATURES.BASIC_REPORTS,
      PLAN_FEATURES.EMAIL_SUPPORT,
      PLAN_FEATURES.WHATSAPP_INTEGRATION,
      PLAN_FEATURES.CUSTOM_REPORTS,
      PLAN_FEATURES.PRIORITY_SUPPORT,
      PLAN_FEATURES.API_ACCESS,
      PLAN_FEATURES.MULTI_BRANCH,
      PLAN_FEATURES.DEDICATED_SUPPORT,
      PLAN_FEATURES.CUSTOM_DEVELOPMENT,
      PLAN_FEATURES.DAILY_BACKUPS,
    ],
  },
}

export const FEATURE_NAMES: Record<PlanFeature, string> = {
  [PLAN_FEATURES.STUDENT_MANAGEMENT]: 'Student Management',
  [PLAN_FEATURES.ATTENDANCE_TRACKING]: 'Attendance Tracking',
  [PLAN_FEATURES.FEE_MANAGEMENT]: 'Fee Management',
  [PLAN_FEATURES.EXAM_MANAGEMENT]: 'Exam Management',
  [PLAN_FEATURES.BASIC_REPORTS]: 'Basic Reports',
  [PLAN_FEATURES.EMAIL_SUPPORT]: 'Email Support',
  [PLAN_FEATURES.WHATSAPP_INTEGRATION]: 'WhatsApp Integration',
  [PLAN_FEATURES.CUSTOM_REPORTS]: 'Custom Reports',
  [PLAN_FEATURES.PRIORITY_SUPPORT]: 'Priority Support',
  [PLAN_FEATURES.WEEKLY_BACKUPS]: 'Weekly Backups',
  [PLAN_FEATURES.API_ACCESS]: 'API Access',
  [PLAN_FEATURES.MULTI_BRANCH]: 'Multi-Branch Support',
  [PLAN_FEATURES.DEDICATED_SUPPORT]: 'Dedicated Support',
  [PLAN_FEATURES.CUSTOM_DEVELOPMENT]: 'Custom Development',
  [PLAN_FEATURES.DAILY_BACKUPS]: 'Daily Backups',
}

export const FEATURE_DESCRIPTIONS: Record<PlanFeature, string> = {
  [PLAN_FEATURES.STUDENT_MANAGEMENT]: 'Complete student profile management with admissions, documents, and academic history',
  [PLAN_FEATURES.ATTENDANCE_TRACKING]: 'Track daily attendance for students and staff with reports',
  [PLAN_FEATURES.FEE_MANAGEMENT]: 'Manage fee collection, invoicing, and payment tracking',
  [PLAN_FEATURES.EXAM_MANAGEMENT]: 'Create exams, manage schedules, and record results',
  [PLAN_FEATURES.BASIC_REPORTS]: 'Essential reports for attendance, fees, and academic performance',
  [PLAN_FEATURES.EMAIL_SUPPORT]: 'Get help via email support',
  [PLAN_FEATURES.WHATSAPP_INTEGRATION]: 'Send WhatsApp messages to students and parents',
  [PLAN_FEATURES.CUSTOM_REPORTS]: 'Generate custom reports with advanced filtering and analytics',
  [PLAN_FEATURES.PRIORITY_SUPPORT]: 'Get faster response times for your support requests',
  [PLAN_FEATURES.WEEKLY_BACKUPS]: 'Automated weekly backups of your school data',
  [PLAN_FEATURES.API_ACCESS]: 'Integrate with third-party systems using our REST API',
  [PLAN_FEATURES.MULTI_BRANCH]: 'Manage multiple school branches from a single account',
  [PLAN_FEATURES.DEDICATED_SUPPORT]: 'Get a dedicated support manager for your school',
  [PLAN_FEATURES.CUSTOM_DEVELOPMENT]: 'Request custom features tailored to your needs',
  [PLAN_FEATURES.DAILY_BACKUPS]: 'Automated daily backups of your school data',
}

// Combined features object for easy consumption
export const FEATURES: Record<PlanFeature, { name: string; description: string }> = {
  [PLAN_FEATURES.STUDENT_MANAGEMENT]: {
    name: FEATURE_NAMES[PLAN_FEATURES.STUDENT_MANAGEMENT],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.STUDENT_MANAGEMENT],
  },
  [PLAN_FEATURES.ATTENDANCE_TRACKING]: {
    name: FEATURE_NAMES[PLAN_FEATURES.ATTENDANCE_TRACKING],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.ATTENDANCE_TRACKING],
  },
  [PLAN_FEATURES.FEE_MANAGEMENT]: {
    name: FEATURE_NAMES[PLAN_FEATURES.FEE_MANAGEMENT],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.FEE_MANAGEMENT],
  },
  [PLAN_FEATURES.EXAM_MANAGEMENT]: {
    name: FEATURE_NAMES[PLAN_FEATURES.EXAM_MANAGEMENT],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.EXAM_MANAGEMENT],
  },
  [PLAN_FEATURES.BASIC_REPORTS]: {
    name: FEATURE_NAMES[PLAN_FEATURES.BASIC_REPORTS],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.BASIC_REPORTS],
  },
  [PLAN_FEATURES.EMAIL_SUPPORT]: {
    name: FEATURE_NAMES[PLAN_FEATURES.EMAIL_SUPPORT],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.EMAIL_SUPPORT],
  },
  [PLAN_FEATURES.WHATSAPP_INTEGRATION]: {
    name: FEATURE_NAMES[PLAN_FEATURES.WHATSAPP_INTEGRATION],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.WHATSAPP_INTEGRATION],
  },
  [PLAN_FEATURES.CUSTOM_REPORTS]: {
    name: FEATURE_NAMES[PLAN_FEATURES.CUSTOM_REPORTS],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.CUSTOM_REPORTS],
  },
  [PLAN_FEATURES.PRIORITY_SUPPORT]: {
    name: FEATURE_NAMES[PLAN_FEATURES.PRIORITY_SUPPORT],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.PRIORITY_SUPPORT],
  },
  [PLAN_FEATURES.WEEKLY_BACKUPS]: {
    name: FEATURE_NAMES[PLAN_FEATURES.WEEKLY_BACKUPS],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.WEEKLY_BACKUPS],
  },
  [PLAN_FEATURES.API_ACCESS]: {
    name: FEATURE_NAMES[PLAN_FEATURES.API_ACCESS],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.API_ACCESS],
  },
  [PLAN_FEATURES.MULTI_BRANCH]: {
    name: FEATURE_NAMES[PLAN_FEATURES.MULTI_BRANCH],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.MULTI_BRANCH],
  },
  [PLAN_FEATURES.DEDICATED_SUPPORT]: {
    name: FEATURE_NAMES[PLAN_FEATURES.DEDICATED_SUPPORT],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.DEDICATED_SUPPORT],
  },
  [PLAN_FEATURES.CUSTOM_DEVELOPMENT]: {
    name: FEATURE_NAMES[PLAN_FEATURES.CUSTOM_DEVELOPMENT],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.CUSTOM_DEVELOPMENT],
  },
  [PLAN_FEATURES.DAILY_BACKUPS]: {
    name: FEATURE_NAMES[PLAN_FEATURES.DAILY_BACKUPS],
    description: FEATURE_DESCRIPTIONS[PLAN_FEATURES.DAILY_BACKUPS],
  },
}
