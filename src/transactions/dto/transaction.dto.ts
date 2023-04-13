type TransactionDto = {
  amount: number;
  counterPartyId: string;
  transactionType: "credit" | "deposit" | "card" | "debit";
} & (
  | { transactionType: "credit" }
  | { transactionType: "deposit" }
  | { transactionType: "card" }
  | { transactionType: "debit"; accountIbanEmitter: string }
);

export default TransactionDto;
