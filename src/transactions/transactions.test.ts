const { prismaMock } = require("../mocks");

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));

import { Request, Response } from "express";
import {
  convertCurrency,
  creditTransaction,
  debitTransaction,
  getAccountBalance,
  transferTransaction,
  validateTransactionData,
} from "./transactions.controller";
import TransactionData from "./dto/transaction.dto";
const {
  getAllTransactions,
  getOneTransaction,
} = require("./transactions.controller");

describe("Transactions Functions", () => {
  beforeEach(async () => {
    await prismaMock.$connect();
    await prismaMock.account.deleteMany();
  });

  afterAll(async () => {
    await prismaMock.$disconnect();
  });
  describe("convertCurrency", () => {
    it("should convert currency correctly", () => {
      expect(convertCurrency(10, "EURO")).toBe(10);
      expect(convertCurrency(10, "EURO")).toBe(10);
      expect(convertCurrency(10, "USD")).toBe(8.33);
      expect(convertCurrency(10, "FCFA")).toBe(0.02);
    });

    it("should throw an error if currency is not supported", () => {
      expect(() => {
        convertCurrency(10, "GBP");
      }).toThrowError("Currency GBP is not supported");
    });
  });

  describe("ValidateTransaction", () => {
    it("should validate transaction data correctly", () => {
      const validTransactionData: TransactionData = {
        amount: 10,
        transactionType: "credit",
        currency: "EURO",
        accountIbanReceiver: "123456789",
      };

      expect(() => {
        validateTransactionData(validTransactionData);
      }).not.toThrow();
    });

    it("should throw an error if transacion data is invalid", () => {
      const invalidTransactionData: TransactionData = {
        amount: 10,
        transactionType: "credit",
        currency: "EURO",
      };

      expect(() => {
        validateTransactionData(invalidTransactionData);
      }).toThrowError('"accountIbanReceiver" is required');
    });

    it("should throw an error if amount is negative", () => {
      const invalidTransactionData: TransactionData = {
        amount: -10,
        transactionType: "credit",
        currency: "EURO",
        accountIbanReceiver: "123456789",
      };

      expect(() => {
        validateTransactionData(invalidTransactionData);
      }).toThrowError('"amount" must be a positive number');
    });
  });

  describe("getAccountBalance", () => {
    it("should return the account balance if the account exists", async () => {
      const accountIban = "123456789";

      prismaMock.account.findUnique.mockResolvedValueOnce({
        iban: accountIban,
        balance: 100,
      });

      const balance = await getAccountBalance(accountIban);

      expect(balance).toBe(100);
    });

    it("should throw an error if the account does not exist", async () => {
      const accountIban = "123456789";

      prismaMock.account.findUnique.mockResolvedValueOnce(null);

      await expect(getAccountBalance(accountIban)).rejects.toThrow(
        "Account not found"
      );
    });

    it("should throw an error if an unexpected error occurs", async () => {
      const accountIban = "123456789";

      prismaMock.account.findUnique.mockRejectedValueOnce(new Error("Boom"));

      await expect(getAccountBalance(accountIban)).rejects.toThrow(
        "Failed to get account balance: Boom"
      );
    });
  });

  describe("creditTransaction", () => {
    it("should credit the account correctly", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "credit",
        currency: "EURO",
        accountIbanReceiver: "123456789",
      };

      prismaMock.account.findUnique.mockResolvedValueOnce({
        iban: transactionData.accountIbanReceiver,
        balance: 0,
      });

      prismaMock.account.update.mockResolvedValueOnce({});

      await creditTransaction(transactionData);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { iban: transactionData.accountIbanReceiver },
        data: { balance: { increment: transactionData.amount } },
      });
    });

    it("should throw an error if the account does not exist", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "credit",
        currency: "EURO",
        accountIbanReceiver: "123456789",
      };

      prismaMock.account.update.mockResolvedValueOnce(null);

      await expect(creditTransaction(transactionData)).rejects.toThrow(
        "Account does not exist"
      );
    });
  });

  describe("debitTransaction", () => {
    it("should debit the account correctly", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "debit",
        currency: "EURO",
        accountIbanEmitter: "123456789",
      };

      prismaMock.account.findUnique.mockResolvedValueOnce({
        iban: transactionData.accountIbanEmitter,
        balance: 0,
      });

      prismaMock.account.update.mockResolvedValueOnce({});

      await debitTransaction(transactionData);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { iban: transactionData.accountIbanEmitter },
        data: { balance: { decrement: transactionData.amount } },
      });
    });

    it("should throw an error if the account does not exist", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "debit",
        currency: "EURO",
        accountIbanEmitter: "123456789",
      };

      prismaMock.account.update.mockResolvedValueOnce(null);

      await expect(debitTransaction(transactionData)).rejects.toThrow(
        "Account does not exist"
      );
    });
  });

  describe("transferTransaction", () => {
    it("should transfer money between accounts correctly", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "transfert",
        currency: "EURO",
        accountIbanEmitter: "123456789",
        accountIbanReceiver: "987654321",
      };

      prismaMock.account.findUnique.mockResolvedValueOnce({
        iban: transactionData.accountIbanEmitter,
        balance: 20,
      });
      prismaMock.account.findUnique.mockResolvedValueOnce({
        iban: transactionData.accountIbanReceiver,
        balance: 10,
      });
      prismaMock.account.update.mockResolvedValueOnce({});
      prismaMock.account.update.mockResolvedValueOnce({});

      await transferTransaction(transactionData);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { iban: transactionData.accountIbanEmitter },
        data: { balance: { decrement: transactionData.amount } },
      });
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { iban: transactionData.accountIbanReceiver },
        data: { balance: { increment: transactionData.amount } },
      });
    });

    it("should throw an error if the emitter account does not exist", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "transfert",
        currency: "EURO",
        accountIbanEmitter: "123456789",
        accountIbanReceiver: "987654321",
      };

      prismaMock.account.findUnique.mockResolvedValueOnce(null);
      prismaMock.account.findUnique.mockResolvedValueOnce({});

      await expect(transferTransaction(transactionData)).rejects.toThrow(
        "Emitter account does not exist"
      );
    });

    it("should throw an error if the receiver account does not exist", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "transfert",
        currency: "EURO",
        accountIbanEmitter: "123456789",
        accountIbanReceiver: "987654321",
      };

      prismaMock.account.findUnique.mockResolvedValueOnce({});
      prismaMock.account.findUnique.mockResolvedValueOnce(null);

      await expect(transferTransaction(transactionData)).rejects.toThrow(
        "Receiver account does not exist"
      );
    });

    it("should throw an error if the emitter account has insufficient funds", async () => {
      const transactionData: TransactionData = {
        amount: 10,
        transactionType: "transfert",
        currency: "EURO",
        accountIbanEmitter: "123456789",
        accountIbanReceiver: "987654321",
      };

      prismaMock.account.findUnique.mockResolvedValueOnce({
        iban: transactionData.accountIbanEmitter,
        balance: 5,
      });
      prismaMock.account.findUnique.mockResolvedValueOnce({
        iban: transactionData.accountIbanReceiver,
        balance: 10,
      });

      await expect(transferTransaction(transactionData)).rejects.toThrow(
        "Emitter account has insufficient funds"
      );
    });
  });
});

describe("getAllTransactions", () => {
  let prismaSpy: jest.SpyInstance;

  beforeEach(() => {
    prismaSpy = jest.spyOn(prismaMock.transaction, "findMany");
  });

  afterEach(() => {
    prismaSpy.mockRestore();
  });
  it("should return a list of transactions", async () => {
    const mockTransactions = [
      {
        id: 1,
        amount: 100,
        currency: "EURO",
        accountIbanEmitter: "FR1234567890123456789012345",
        accountIbanReceiver: "FR1234567890123456789012345",
        transactionType: "transfert",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        amount: 200,
        currency: "EURO",
        accountIbanEmitter: "FR1234567890123456789012345",
        accountIbanReceiver: "FR1234567890123456789012345",
        transactionType: "tranfert",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    prismaMock.transaction.findMany.mockResolvedValueOnce(mockTransactions);

    const req = {
      query: {
        page: "1",
        pageSize: "5",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    prismaMock.transaction.count.mockResolvedValueOnce(mockTransactions.length);

    await getAllTransactions(req, res);

    expect(prismaMock.transaction.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 5,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalRecords: mockTransactions.length,
      totalPages: 1,
      currentPage: 1,
      transactions: mockTransactions,
    });
  });

  it("should return an empty array if if database is empty", async () => {
    const mockTransactions: never[] = [];

    prismaMock.transaction.findMany.mockResolvedValueOnce(mockTransactions);

    const req = {
      query: {
        page: "1",
        pageSize: "5",
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    prismaMock.transaction.count.mockResolvedValueOnce(mockTransactions.length);

    await getAllTransactions(req, res);

    expect(prismaMock.transaction.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 5,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      totalRecords: mockTransactions.length,
      totalPages: 0,
      currentPage: 0,
      transactions: mockTransactions,
    });
  });
});

describe("getOneTransaction", () => {
  let prismaSpy: jest.SpyInstance;

  beforeEach(() => {
    prismaSpy = jest.spyOn(prismaMock.transaction, "findUnique");
  });

  afterEach(() => {
    prismaSpy.mockRestore();
  });
  it("should return one transaction when given a valid id ", async () => {
    const mockTransaction = {
      id: 1,
      amount: 100,
      currency: "EURO",
      accountIbanEmitter: "FR1234567890123456789012345",
      accountIbanReceiver: "FR1234567890123456789012345",
      transactionType: "credit",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.transaction.findUnique.mockResolvedValueOnce(mockTransaction);

    const req = {
      params: {
        id: "1",
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getOneTransaction(req, res);

    expect(prismaMock.transaction.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
      where: { id: mockTransaction.id },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTransaction);
  });

  it("should return 404 and and error when given a invalid id", async () => {
    prismaMock.transaction.findUnique.mockResolvedValueOnce(null);
    const req = {
      params: {
        id: "999",
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getOneTransaction(req, res);

    expect(prismaMock.transaction.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
      where: {
        id: 999,
      },
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Transaction with id 999 not found",
    });
  });

  it("should return an error if an error occurs while getting the transaction", async () => {
    prismaMock.transaction.findUnique.mockRejectedValueOnce(
      new Error("Error to get transaction")
    );

    const req = {
      params: {
        id: "1",
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await getOneTransaction(req, res);

    expect(prismaMock.transaction.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Error to get transaction",
    });
  });
});
