// import Joi from "joi";
const Joi = require("joi")

export const accountSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().required(),
  balance: Joi.number().positive().required(),
  currency: Joi.string().valid("XOF").required(),
  bic: Joi.string().required(),
  accountType: Joi.string().valid("current", "savings", "blocked"),
})
