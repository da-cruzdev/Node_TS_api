"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSchema = void 0;
// import Joi from "joi";
const Joi = require("joi");
exports.TransactionSchema = Joi.object({
    amount: Joi.number().positive().required(),
    transactionType: Joi.string()
        .valid("credit", "debit", "transfert")
        .required(),
    currency: Joi.string().valid("FCFA", "USD", "EURO").when("transactionType", {
        is: "debit",
        then: Joi.string().optional(),
        otherwise: Joi.string().required(),
    }),
    accountIbanEmitter: Joi.string().when("transactionType", {
        is: "debit",
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),
    accountIbanReceiver: Joi.string().when("transactionType", {
        is: "credit",
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),
});
