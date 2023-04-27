"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
// import Joi from "joi";
const Joi = require("joi");
exports.userSchema = Joi.object({
    name: Joi.string().min(3).max(30).trim().required(),
    email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "fr"] } })
        .trim()
        .required(),
    password: Joi.string()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .trim()
        .required(),
});
