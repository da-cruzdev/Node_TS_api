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
exports.deleteSubAccount = exports.deleteAccount = exports.updateAccount = exports.unblockAccount = exports.getSubAccountByIban = exports.getSubAccountsByParentId = exports.getOneAccount = exports.getAllAccounts = exports.createSubAccount = exports.createAccount = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const account_validator_1 = require("./validators/account.validator");
const prisma = new client_1.PrismaClient();
const createAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, number, balance, currency, bic } = req.body;
        const validateData = yield account_validator_1.accountSchema.validateAsync({ name, email, number, balance, currency, bic, accountType: "courant" }, {
            abortEarly: false,
        });
        const ibanPrefix = "CI";
        const iban = `${ibanPrefix}${(0, uuid_1.v4)()}`;
        const newAccount = {
            iban,
            name: validateData.name,
            email: validateData.email,
            number: validateData.number,
            balance: validateData.balance,
            currency: validateData.currency,
            bic: validateData.bic,
            accountType: validateData.accountType,
        };
        const createdAccount = yield prisma.account.create({ data: newAccount });
        res.status(200).json(createdAccount);
    }
    catch (error) {
        res.status(400).json({ error: error.details[0].message });
    }
});
exports.createAccount = createAccount;
const createSubAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { accountIban, name, email, number, balance, currency, bic, accountType, } = req.body;
        const validationResult = account_validator_1.accountSchema.validate({
            name,
            email,
            number,
            balance,
            currency,
            bic,
            accountType,
        }, { abortEarly: false });
        if (validationResult.error) {
            return res
                .status(400)
                .json({ error: validationResult.error.details[0].message });
        }
        const mainAccount = yield prisma.account.findUnique({
            where: { iban: accountIban },
        });
        if (!mainAccount) {
            return res.status(404).json({ error: "Main account not found" });
        }
        if (mainAccount.accountType !== "courant") {
            return res
                .status(400)
                .json({ error: "Main account must be of type courant" });
        }
        let subAccountType;
        if (accountType === "savings" || accountType === "blocked") {
            subAccountType = accountType;
        }
        else {
            return res
                .status(400)
                .json({ error: "Invalid account type for sub account" });
        }
        const ibanPrefix = "CI";
        const iban = `${ibanPrefix}${(0, uuid_1.v4)()}`;
        const newSubAccount = {
            iban,
            name,
            email,
            number,
            balance,
            currency,
            bic,
            accountType: subAccountType,
            parentId: accountIban,
        };
        const createdSubAccount = yield prisma.account.create({
            data: newSubAccount,
        });
        res.status(200).json(createdSubAccount);
    }
    catch (error) {
        res.status(500).json({
            error: `Please ${error.meta.target[0]} already exists...Enter another one`,
        });
    }
});
exports.createSubAccount = createSubAccount;
const getAllAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, pageSize } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSizeNumber = parseInt(pageSize) || 5;
    const totalRecords = yield prisma.account.count({
        where: { parentId: null },
    });
    const totalPages = Math.ceil(totalRecords / pageSizeNumber);
    const currentPage = pageNumber > totalPages ? totalPages : pageNumber;
    const skip = Math.max((currentPage - 1) * pageSizeNumber, 0);
    const accounts = yield prisma.account.findMany({
        where: {
            parentId: null,
        },
        skip: skip,
        take: pageSizeNumber,
    });
    const response = {
        totalRecords: totalRecords,
        totalPages: totalPages,
        currentPage: currentPage,
        accounts: accounts,
    };
    res.status(200).json(response);
});
exports.getAllAccounts = getAllAccounts;
const getOneAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iban } = req.params;
        const account = yield prisma.account.findUnique({ where: { iban } });
        if (!account)
            res.status(404).json({ error: `Account with iban ${iban} not found` });
        return res.status(200).json(account);
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.getOneAccount = getOneAccount;
const getSubAccountsByParentId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iban } = req.params;
        const parentAccount = yield prisma.account.findUnique({
            where: {
                iban,
            },
        });
        if (!parentAccount) {
            res.status(404).json({ error: "Parent account not found" });
        }
        const subAccounts = yield prisma.account.findMany({
            where: {
                parentId: iban,
            },
        });
        res.status(200).json(subAccounts);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Failed to get sub-accounts", message: error.message });
    }
});
exports.getSubAccountsByParentId = getSubAccountsByParentId;
const getSubAccountByIban = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iban } = req.params;
        const subAccount = yield prisma.account.findUnique({
            where: { iban },
        });
        if (!subAccount) {
            return res.status(404).json({ error: "Sub-account not found" });
        }
        res.status(200).json(subAccount);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to get sub-account",
        });
    }
});
exports.getSubAccountByIban = getSubAccountByIban;
const unblockAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iban } = req.params;
        const accountData = yield prisma.account.findUnique({
            where: { iban },
        });
        if (!accountData) {
            throw new Error("Account not found");
        }
        if (accountData.accountType !== "blocked") {
            throw new Error("Account is not blocked");
        }
        yield prisma.account.update({
            where: { iban },
            data: { accountType: "savings" },
        });
        return res.status(200).json({ message: "Account unblocked successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.unblockAccount = unblockAccount;
const updateAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iban, name, email, number, balance, currency, bic, accountType } = req.body;
        const validationResult = account_validator_1.accountSchema.validate({
            name,
            email,
            number,
            balance,
            currency,
            bic,
            accountType,
        }, { abortEarly: false });
        if (validationResult.error) {
            return res
                .status(400)
                .json({ error: validationResult.error.details[0].message });
        }
        const existingAccount = yield prisma.account.findUnique({
            where: { iban },
        });
        if (!existingAccount) {
            return res.status(404).json({ error: "Account not found" });
        }
        if (existingAccount.accountType === "blocked") {
            return res
                .status(400)
                .json({ error: "Blocked account cannot be updated" });
        }
        let updatedAccountType;
        if (accountType === "savings" || accountType === "blocked") {
            updatedAccountType = accountType;
        }
        else {
            return res.status(400).json({ error: "Invalid account type for update" });
        }
        const updatedAccount = yield prisma.account.update({
            where: { iban },
            data: {
                name,
                email,
                number,
                balance,
                currency,
                bic,
                accountType: updatedAccountType,
            },
        });
        res.status(200).json(updatedAccount);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.updateAccount = updateAccount;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iban } = req.params;
        const existingAccount = yield prisma.account.findUnique({
            where: { iban },
        });
        if (!existingAccount) {
            return res.status(404).json({ error: "Account not found" });
        }
        if (existingAccount.accountType === "blocked") {
            return res
                .status(400)
                .json({ error: "Blocked account cannot be deleted" });
        }
        yield prisma.account.delete({ where: { iban } });
        res.status(200).json({ message: "Account successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.deleteAccount = deleteAccount;
const deleteSubAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { iban } = req.params;
        const existingSubAccount = yield prisma.account.findUnique({
            where: { iban },
        });
        if (!existingSubAccount) {
            return res.status(404).json({ error: "Sub-account not found" });
        }
        if (existingSubAccount.accountType === "blocked") {
            return res
                .status(400)
                .json({ error: "Blocked sub-account cannot be deleted" });
        }
        yield prisma.account.delete({ where: { iban } });
        res.status(200).json({ message: "Sub-account successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.deleteSubAccount = deleteSubAccount;
