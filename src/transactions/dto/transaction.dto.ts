interface TransactionData {
  amount: number;
  accountIbanReceiver?: string;
  currency: "USD" | "EURO";
  transactionType: "credit" | "debit" | "transfert";
  accountIbanEmitter?: string;
}

export default TransactionData;
