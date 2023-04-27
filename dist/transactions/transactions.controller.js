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
exports.getOneTransaction = exports.getAllTransactions = exports.transferTransaction = exports.debitTransaction = exports.creditTransaction = exports.getAccountBalance = exports.validateTransactionData = exports.convertCurrency = exports.createTransaction = void 0;
const client_1 = require("@prisma/client");
const transaction_validator_1 = require("./validators/transaction.validator");
const prisma = new client_1.PrismaClient();
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, transactionType, currency, accountIbanEmitter, accountIbanReceiver, } = req.body;
        let transactionData;
        switch (transactionType) {
            case "credit":
                transactionData = {
                    amount: (0, exports.convertCurrency)(amount, currency),
                    transactionType,
                    currency,
                    accountIbanReceiver,
                };
                break;
            case "debit":
                const accountEmitter = yield prisma.account.findUnique({
                    where: { iban: accountIbanEmitter },
                });
                if ((accountEmitter === null || accountEmitter === void 0 ? void 0 : accountEmitter.accountType) === "blocked") {
                    throw new Error("Blocked accounts can only perform credit transactions");
                }
                transactionData = {
                    amount: amount,
                    transactionType,
                    currency: "EURO",
                    accountIbanEmitter,
                };
                break;
            case "transfert":
                const accountEmitterTransfer = yield prisma.account.findUnique({
                    where: { iban: accountIbanEmitter },
                });
                if ((accountEmitterTransfer === null || accountEmitterTransfer === void 0 ? void 0 : accountEmitterTransfer.accountType) === "blocked") {
                    throw new Error("Blocked accounts can only perform credit transactions");
                }
                transactionData = {
                    amount: (0, exports.convertCurrency)(amount, currency),
                    transactionType,
                    currency,
                    accountIbanReceiver,
                    accountIbanEmitter,
                };
                break;
            default:
                return res.status(400).json({ error: "Invalid transaction type" });
        }
        (0, exports.validateTransactionData)(transactionData);
        const createdTransaction = yield prisma.transaction.create({
            data: transactionData,
        });
        switch (transactionType) {
            case "credit":
                yield (0, exports.creditTransaction)(transactionData);
                break;
            case "debit":
                if (transactionData.amount > (yield (0, exports.getAccountBalance)(accountIbanEmitter))) {
                    throw new Error("Insufficient balance in the account for the debit transaction");
                }
                yield (0, exports.debitTransaction)(transactionData);
                break;
            case "transfert":
                if (transactionData.amount > (yield (0, exports.getAccountBalance)(accountIbanEmitter))) {
                    throw new Error("Insufficient balance in the account for the transfer transaction");
                }
                yield (0, exports.transferTransaction)(transactionData);
                break;
            default:
                return res.status(400).json({ error: "Invalid transaction type" });
        }
        res.status(200).json(createdTransaction);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.createTransaction = createTransaction;
const convertCurrency = (amount, fromCurrency) => {
    const exchangeRates = {
        EURO: 1,
        USD: 1.2,
        FCFA: 656,
    };
    if (!exchangeRates[fromCurrency]) {
        throw new Error(`Currency ${fromCurrency} is not supported`);
    }
    const convertedAmount = amount / exchangeRates[fromCurrency];
    return Math.round(convertedAmount * 100) / 100;
};
exports.convertCurrency = convertCurrency;
const validateTransactionData = (transactionData) => {
    const validation = transaction_validator_1.TransactionSchema.validate(transactionData, {
        abortEarly: false,
    });
    if (validation.error) {
        throw new Error(validation.error.details[0].message);
    }
};
exports.validateTransactionData = validateTransactionData;
const getAccountBalance = (accountIban) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const account = yield prisma.account.findUnique({
            where: {
                iban: accountIban,
            },
        });
        if (!account) {
            throw new Error("Account not found");
        }
        return account.balance;
    }
    catch (error) {
        throw new Error(`Failed to get account balance: ${error.message}`);
    }
});
exports.getAccountBalance = getAccountBalance;
const creditTransaction = (transactionData) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield prisma.account.findUnique({
        where: { iban: transactionData.accountIbanReceiver },
    });
    if (!account) {
        throw new Error("Account does not exist");
    }
    yield prisma.account.update({
        where: { iban: transactionData.accountIbanReceiver },
        data: { balance: { increment: transactionData.amount } },
    });
});
exports.creditTransaction = creditTransaction;
const debitTransaction = (transactionData) => __awaiter(void 0, void 0, void 0, function* () {
    const accountData = yield prisma.account.findUnique({
        where: { iban: transactionData.accountIbanEmitter },
    });
    if (!accountData) {
        throw new Error("Account does not exist");
    }
    if (accountData && accountData.accountType === "blocked") {
        throw new Error("emitter account blocked");
    }
    yield prisma.account.update({
        where: { iban: transactionData.accountIbanEmitter },
        data: { balance: { decrement: transactionData.amount } },
    });
});
exports.debitTransaction = debitTransaction;
const transferTransaction = (transactionData) => __awaiter(void 0, void 0, void 0, function* () {
    const accountIbanEmitterData = yield prisma.account.findUnique({
        where: { iban: transactionData.accountIbanEmitter },
    });
    const accountIbanReceiverData = yield prisma.account.findUnique({
        where: { iban: transactionData.accountIbanReceiver },
    });
    if (!accountIbanEmitterData) {
        throw new Error("Emitter account does not exist");
    }
    if (!accountIbanReceiverData) {
        throw new Error("Receiver account does not exist");
    }
    if (accountIbanEmitterData.accountType === "blocked" ||
        accountIbanEmitterData.balance < transactionData.amount) {
        throw new Error("Emitter account has insufficient funds");
    }
    yield prisma.account.update({
        where: { iban: transactionData.accountIbanEmitter },
        data: { balance: { decrement: transactionData.amount } },
    });
    yield prisma.account.update({
        where: { iban: transactionData.accountIbanReceiver },
        data: { balance: { increment: transactionData.amount } },
    });
});
exports.transferTransaction = transferTransaction;
const getAllTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, pageSize } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSizeNumber = parseInt(pageSize) || 5;
    const totalRecords = yield prisma.transaction.count();
    const totalPages = Math.ceil(totalRecords / pageSizeNumber);
    const currentPage = pageNumber > totalPages ? totalPages : pageNumber;
    const skip = Math.max((currentPage - 1) * pageSizeNumber, 0);
    const transactions = yield prisma.transaction.findMany({
        skip: skip,
        take: pageSizeNumber,
    });
    const response = {
        totalRecords: totalRecords,
        totalPages: totalPages,
        currentPage: currentPage,
        transactions: transactions,
    };
    res.status(200).json(response);
});
exports.getAllTransactions = getAllTransactions;
const getOneTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = +req.params.id;
        const transaction = yield prisma.transaction.findUnique({ where: { id } });
        if (!transaction)
            res.status(404).json({ error: `Transaction with id ${id} not found` });
        else
            return res.status(200).json(transaction);
    }
    catch (error) {
        res.status(500).json({ error: `Error to get transaction` });
    }
});
exports.getOneTransaction = getOneTransaction;
