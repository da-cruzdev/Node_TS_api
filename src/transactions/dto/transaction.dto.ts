interface TransactionData {
  amount: number
  accountIbanReceiver?: string
  reason?: string
  transactionType: "credit" | "debit" | "transfert"
  status?: "in process" | "approved" | "rejected"
  accountIbanEmitter?: string
}

export default TransactionData
