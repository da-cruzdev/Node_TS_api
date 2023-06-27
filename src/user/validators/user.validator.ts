import { validate } from "uuid"

// import Joi from "joi";
const Joi = require("joi")

export const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).trim().required(),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "fr"] } })
    .trim()
    .required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).trim().required(),
})

export const validateUpdateUser = Joi.object({
  name: Joi.string().min(3).max(30).trim().optional(),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "fr"] } })
    .trim()
    .optional(),
  oldPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).trim().optional(),
  newPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).trim().optional(),
})
