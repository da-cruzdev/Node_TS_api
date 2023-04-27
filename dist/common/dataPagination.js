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
exports.getdataWithPagination = void 0;
const getdataWithPagination = (data, req) => __awaiter(void 0, void 0, void 0, function* () {
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / 5);
    const currentPage = req && req.query && req.query.page ? parseInt(req.query.page) : 1;
    const startIndex = (currentPage - 1) * 5;
    const endIndex = startIndex + 5;
    const dataPerPage = data.slice(startIndex, endIndex);
    const response = {
        totalRecords,
        totalPages,
        currentPage,
        data: dataPerPage,
    };
    return response;
});
exports.getdataWithPagination = getdataWithPagination;
