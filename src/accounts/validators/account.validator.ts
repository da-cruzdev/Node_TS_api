import Joi from "joi";

export const accountSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().required(),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "fr"] } })
    .trim()
    .required(),
  number: Joi.string()
    .regex(/^(?:\+|00)225|0[17]\d{8}$/)
    .required(),
  balance: Joi.number().required(),
  currency: Joi.string().required(),
  bic: Joi.string().required(),
  accountType: Joi.string().required(),
});