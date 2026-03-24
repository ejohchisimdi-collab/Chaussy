import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { confirmPasswordReset, generatePassWordReset } from "./passwordService.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { ConfirmPasswordResetSchema } from "./schema.js";

export const passwordRouter=Router()

passwordRouter.post("/reset",asyncHandler(generatePassWordReset))
passwordRouter.post("/confirmation",validate(ConfirmPasswordResetSchema),asyncHandler(confirmPasswordReset))
