export interface TransactionFilterOptions {
  accountType?: AccountType
  status?: TransactionStatus
  query?: string
  date?: string
}

export enum TransactionStatus {
  IN_PROCESS = "in process",
  APPROVED = "approved",
  REJECTED = "rejected",
}

enum AccountType {
  CURRENT = "current",
  SAVINGS = "savings",
  BLOCKED = "blocked",
}
