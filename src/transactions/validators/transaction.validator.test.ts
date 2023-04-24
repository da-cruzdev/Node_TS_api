import { TransactionSchema } from "./transaction.validator";

function validateTransaction(transaction: {
  accountIbanReceiver: string;
  amount: number;
  transactionType: string;
}) {
  TransactionSchema;
  return TransactionSchema.validate(transaction);
}

describe("TransactionSchema", () => {
  it("should validate a valid transaction object", () => {
    const validTransaction = {
      accountIbanReceiver: "DE78944-94848454465-465776",
      amount: 100,
      transactionType: "credit",
    };

    const expected = {
      error: undefined,
      value: expect.objectContaining(validTransaction),
    };

    const mockValidator = jest.spyOn(TransactionSchema, "validate");
    mockValidator.mockReturnValue(expected);

    const result = validateTransaction(validTransaction);

    expect(result).toEqual(expected);

    mockValidator.mockRestore();
  });

  it("should return an error if amount is negative", () => {
    const validTransaction = {
      accountIbanReceiver: "DE78944-94848454465-465776",
      amount: -100,
      transactionType: "credit",
    };

    const expected = { error: "Amount should be a positive number" };

    const mockValidator = jest.spyOn(TransactionSchema, "validate");
    mockValidator.mockReturnValue(expected);

    const result = validateTransaction(validTransaction);

    expect(result).toEqual(expected);

    mockValidator.mockRestore();
  });
});
