import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { AddWarrantySchema, EditWarrantySchema, WarrantyDocumentSchema } from "./schema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { addWarranty, deleteWarrantyDocuments, editWarranties, extractWarrantyInfoFromPdf, findDocumentByWarranty, findWarrantyByAsset, findWarrantyDocumentLink, uploadDocuments } from "./warrantyService.js";
import { uploadAutoDocuments, uploadWarrantyDocuments } from "../middleware/multerMiddleWare.js";

export const warrantyRouter =Router()

warrantyRouter.post("/",authMiddleware,validate(AddWarrantySchema),asyncHandler(addWarranty))

warrantyRouter.put("/",authMiddleware,validate(EditWarrantySchema),asyncHandler(editWarranties))

warrantyRouter.get("/:assetId",authMiddleware,asyncHandler(findWarrantyByAsset))

warrantyRouter.post("/documents/:warrantyId",authMiddleware,uploadWarrantyDocuments.single("file"),validate(WarrantyDocumentSchema),asyncHandler(uploadDocuments))

warrantyRouter.delete("/documents/:documentId",authMiddleware,deleteWarrantyDocuments)

warrantyRouter.get("/documents/:warrantyId",authMiddleware,asyncHandler(findDocumentByWarranty))

warrantyRouter.get("/documents/url/:documentId",authMiddleware,asyncHandler(findWarrantyDocumentLink))

warrantyRouter.post("/documents/auto/:assetId",authMiddleware,uploadAutoDocuments.single("file"),asyncHandler(extractWarrantyInfoFromPdf))
