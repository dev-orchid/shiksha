export const EMPLOYEE_TYPES = {
  TEACHING: 'teaching',
  NON_TEACHING: 'non_teaching',
  ADMINISTRATIVE: 'administrative',
  SUPPORT: 'support',
} as const

export type EmployeeType = (typeof EMPLOYEE_TYPES)[keyof typeof EMPLOYEE_TYPES]

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  [EMPLOYEE_TYPES.TEACHING]: 'Teaching',
  [EMPLOYEE_TYPES.NON_TEACHING]: 'Non-Teaching',
  [EMPLOYEE_TYPES.ADMINISTRATIVE]: 'Administrative',
  [EMPLOYEE_TYPES.SUPPORT]: 'Support',
}

// For use in Select components
export const EMPLOYEE_TYPE_OPTIONS = [
  { value: EMPLOYEE_TYPES.TEACHING, label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES.TEACHING] },
  { value: EMPLOYEE_TYPES.NON_TEACHING, label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES.NON_TEACHING] },
  { value: EMPLOYEE_TYPES.ADMINISTRATIVE, label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES.ADMINISTRATIVE] },
  { value: EMPLOYEE_TYPES.SUPPORT, label: EMPLOYEE_TYPE_LABELS[EMPLOYEE_TYPES.SUPPORT] },
]

// For salary structure form (includes "All" option)
export const EMPLOYEE_TYPE_OPTIONS_WITH_ALL = [
  { value: '', label: 'All Employee Types' },
  ...EMPLOYEE_TYPE_OPTIONS,
]

// Helper to get label from value
export const getEmployeeTypeLabel = (value: string | null | undefined): string => {
  if (!value) return 'Unknown'
  return EMPLOYEE_TYPE_LABELS[value as EmployeeType] || value
}
