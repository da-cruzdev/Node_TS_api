import Joi from "joi";

export const TransactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  counterPartyId: Joi.string().required(),
  transactionType: Joi.string()
    .valid("credit", "deposit", "card", "debit")
    .required(),
  accountIbanEmitter: Joi.string().when("transactionType", {
    is: "debit",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
