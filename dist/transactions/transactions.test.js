"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { prismaMock } = require("../mocks");
jest.mock("@prisma/client", () => ({
    PrismaClient: jest.fn().mockImplementation(() => prismaMock),
}));
const transactions_controller_1 = require("./transactions.controller");
const { getAllTransactions, getOneTransaction, } = require("./transactions.controller");
describe("Transactions Functions", () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaMock.$connect();
        yield prismaMock.account.deleteMany();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prismaMock.$disconnect();
    }));
    describe("convertCurrency", () => {
        it("should convert currency correctly", () => {
            expect((0, transactions_controller_1.convertCurrency)(10, "EURO")).toBe(10);
            expect((0, transactions_controller_1.convertCurrency)(10, "EURO")).toBe(10);
            expect((0, transactions_controller_1.convertCurrency)(10, "USD")).toBe(8.33);
            expect((0, transactions_controller_1.convertCurrency)(10, "FCFA")).toBe(0.02);
        });
        it("should throw an error if currency is not supported", () => {
            expect(() => {
                (0, transactions_controller_1.convertCurrency)(10, "GBP");
            }).toThrowError("Currency GBP is not supported");
        });
    });
    describe("ValidateTransaction", () => {
        it("should validate transaction data correctly", () => {
            const validTransactionData = {
                amount: 10,
                transactionType: "credit",
                currency: "EURO",
                accountIbanReceiver: "123456789",
            };
            expect(() => {
                (0, transactions_controller_1.validateTransactionData)(validTransactionData);
            }).not.toThrow();
        });
        it("should throw an error if transacion data is invalid", () => {
            const invalidTransactionData = {
                amount: 10,
                transactionType: "credit",
                currency: "EURO",
            };
            expect(() => {
                (0, transactions_controller_1.validateTransactionData)(invalidTransactionData);
            }).toThrowError('"accountIbanReceiver" is required');
        });
        it("should throw an error if amount is negative", () => {
            const invalidTransactionData = {
                amount: -10,
                transactionType: "credit",
                currency: "EURO",
                accountIbanReceiver: "123456789",
            };
            expect(() => {
                (0, transactions_controller_1.validateTransactionData)(invalidTransactionData);
            }).toThrowError('"amount" must be a positive number');
        });
    });
    describe("getAccountBalance", () => {
        it("should return the account balance if the account exists", () => __awaiter(void 0, void 0, void 0, function* () {
            const accountIban = "123456789";
            prismaMock.account.findUnique.mockResolvedValueOnce({
                iban: accountIban,
                balance: 100,
            });
            const balance = yield (0, transactions_controller_1.getAccountBalance)(accountIban);
            expect(balance).toBe(100);
        }));
        it("should throw an error if the account does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
            const accountIban = "123456789";
            prismaMock.account.findUnique.mockResolvedValueOnce(null);
            yield expect((0, transactions_controller_1.getAccountBalance)(accountIban)).rejects.toThrow("Account not found");
        }));
        it("should throw an error if an unexpected error occurs", () => __awaiter(void 0, void 0, void 0, function* () {
            const accountIban = "123456789";
            prismaMock.account.findUnique.mockRejectedValueOnce(new Error("Boom"));
            yield expect((0, transactions_controller_1.getAccountBalance)(accountIban)).rejects.toThrow("Failed to get account balance: Boom");
        }));
    });
    describe("creditTransaction", () => {
        it("should credit the account correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
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
            yield (0, transactions_controller_1.creditTransaction)(transactionData);
            expect(prismaMock.account.update).toHaveBeenCalledWith({
                where: { iban: transactionData.accountIbanReceiver },
                data: { balance: { increment: transactionData.amount } },
            });
        }));
        it("should throw an error if the account does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
                amount: 10,
                transactionType: "credit",
                currency: "EURO",
                accountIbanReceiver: "123456789",
            };
            prismaMock.account.update.mockResolvedValueOnce(null);
            yield expect((0, transactions_controller_1.creditTransaction)(transactionData)).rejects.toThrow("Account does not exist");
        }));
    });
    describe("debitTransaction", () => {
        it("should debit the account correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
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
            yield (0, transactions_controller_1.debitTransaction)(transactionData);
            expect(prismaMock.account.update).toHaveBeenCalledWith({
                where: { iban: transactionData.accountIbanEmitter },
                data: { balance: { decrement: transactionData.amount } },
            });
        }));
        it("should throw an error if the account does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
                amount: 10,
                transactionType: "debit",
                currency: "EURO",
                accountIbanEmitter: "123456789",
            };
            prismaMock.account.update.mockResolvedValueOnce(null);
            yield expect((0, transactions_controller_1.debitTransaction)(transactionData)).rejects.toThrow("Account does not exist");
        }));
    });
    describe("transferTransaction", () => {
        it("should transfer money between accounts correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
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
            yield (0, transactions_controller_1.transferTransaction)(transactionData);
            expect(prismaMock.account.update).toHaveBeenCalledWith({
                where: { iban: transactionData.accountIbanEmitter },
                data: { balance: { decrement: transactionData.amount } },
            });
            expect(prismaMock.account.update).toHaveBeenCalledWith({
                where: { iban: transactionData.accountIbanReceiver },
                data: { balance: { increment: transactionData.amount } },
            });
        }));
        it("should throw an error if the emitter account does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
                amount: 10,
                transactionType: "transfert",
                currency: "EURO",
                accountIbanEmitter: "123456789",
                accountIbanReceiver: "987654321",
            };
            prismaMock.account.findUnique.mockResolvedValueOnce(null);
            prismaMock.account.findUnique.mockResolvedValueOnce({});
            yield expect((0, transactions_controller_1.transferTransaction)(transactionData)).rejects.toThrow("Emitter account does not exist");
        }));
        it("should throw an error if the receiver account does not exist", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
                amount: 10,
                transactionType: "transfert",
                currency: "EURO",
                accountIbanEmitter: "123456789",
                accountIbanReceiver: "987654321",
            };
            prismaMock.account.findUnique.mockResolvedValueOnce({});
            prismaMock.account.findUnique.mockResolvedValueOnce(null);
            yield expect((0, transactions_controller_1.transferTransaction)(transactionData)).rejects.toThrow("Receiver account does not exist");
        }));
        it("should throw an error if the emitter account has insufficient funds", () => __awaiter(void 0, void 0, void 0, function* () {
            const transactionData = {
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
            yield expect((0, transactions_controller_1.transferTransaction)(transactionData)).rejects.toThrow("Emitter account has insufficient funds");
        }));
    });
});
describe("getAllTransactions", () => {
    let prismaSpy;
    beforeEach(() => {
        prismaSpy = jest.spyOn(prismaMock.transaction, "findMany");
    });
    afterEach(() => {
        prismaSpy.mockRestore();
    });
    it("should return a list of transactions", () => __awaiter(void 0, void 0, void 0, function* () {
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
        };
        prismaMock.transaction.count.mockResolvedValueOnce(mockTransactions.length);
        yield getAllTransactions(req, res);
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
    }));
    it("should return an empty array if if database is empty", () => __awaiter(void 0, void 0, void 0, function* () {
        const mockTransactions = [];
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
        };
        prismaMock.transaction.count.mockResolvedValueOnce(mockTransactions.length);
        yield getAllTransactions(req, res);
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
    }));
});
describe("getOneTransaction", () => {
    let prismaSpy;
    beforeEach(() => {
        prismaSpy = jest.spyOn(prismaMock.transaction, "findUnique");
    });
    afterEach(() => {
        prismaSpy.mockRestore();
    });
    it("should return one transaction when given a valid id ", () => __awaiter(void 0, void 0, void 0, function* () {
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
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        yield getOneTransaction(req, res);
        expect(prismaMock.transaction.findUnique).toHaveBeenCalledTimes(1);
        expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
            where: { id: mockTransaction.id },
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockTransaction);
    }));
    it("should return 404 and and error when given a invalid id", () => __awaiter(void 0, void 0, void 0, function* () {
        prismaMock.transaction.findUnique.mockResolvedValueOnce(null);
        const req = {
            params: {
                id: "999",
            },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        yield getOneTransaction(req, res);
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
    }));
    it("should return an error if an error occurs while getting the transaction", () => __awaiter(void 0, void 0, void 0, function* () {
        prismaMock.transaction.findUnique.mockRejectedValueOnce(new Error("Error to get transaction"));
        const req = {
            params: {
                id: "1",
            },
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        yield getOneTransaction(req, res);
        expect(prismaMock.transaction.findUnique).toHaveBeenCalledTimes(1);
        expect(prismaMock.transaction.findUnique).toHaveBeenCalledWith({
            where: { id: 1 },
        });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Error to get transaction",
        });
    }));
});
