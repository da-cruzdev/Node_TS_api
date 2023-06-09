export const formatDataResponse = (data: any, model: string) => {
  if (model === "Transaction") {
    return {
      id: data.id,
      amount: data.amount,
      counterPartyId: data.counterPartyId,
      transactionType: data.transactionType,
      createdAt: data.createdAt.toDateString(),
      updatedAt: data.updatedAt.toDateString(),
      accountIbanEmitter: data.accountIbanEmitter,
    };
  } else if (model === "Account") {
    return {
      id: data.id,
      iban: data.iban,
      balance: data.balance,
      currency: data.currency,
      createdAt: data.createdAt.toDateString(),
      updatedAt: data.updatedAt.toDateString(),
    };
  }
};
