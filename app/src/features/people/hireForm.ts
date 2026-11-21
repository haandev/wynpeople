export const STEPS = ['Personal', 'Job', 'Compensation', 'Review'] as const

export interface HireForm {
  givenName: string
  familyName: string
  preferredName: string
  email: string
  username: string
  hireDate: string
  employeeNumber: string
  jobTitle: string
  departmentTeamId: string
  productTeamId: string
  officeTeamId: string
  managerUserId: string
  costCenter: string
  employmentType: string
  workerType: string
  payRate: string
  currency: string
  payType: string
  payPeriod: string
}

/** Required fields per step, mirroring hr.hireEmployee's required parameters. */
export const REQUIRED: Record<(typeof STEPS)[number], (keyof HireForm)[]> = {
  Personal: ['givenName', 'familyName', 'email', 'username'],
  Job: ['hireDate', 'employeeNumber', 'jobTitle', 'departmentTeamId', 'officeTeamId', 'employmentType'],
  Compensation: ['payRate', 'currency', 'payType', 'payPeriod'],
  Review: [],
}

/** The username suggested for a new employee: the work email's part before @, lower-cased. Empty until there is an @. */
export const usernameFromEmail = (email: string) => {
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at).trim().toLowerCase() : ''
}
