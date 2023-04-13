interface TransactionData {
  amount: number;
  accountIbanReceiver?: string;
  transactionType: "credit" | "debit" | "transfert";
  accountIbanEmitter?: string;
}

export default TransactionData;
