// import Joi from "joi";
const Joi = require("joi");

export const TransactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  transactionType: Joi.string()
    .valid("credit", "debit", "transfert")
    .required(),
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
