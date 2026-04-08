import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { confirmPasswordReset, generatePassWordReset } from "./passwordService.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { ConfirmPasswordResetSchema } from "./schema.js";
import { authLimiter, sensitiveRouteLimiter } from "../middleware/ratelimtiMiddleware.js";

export const passwordRouter=Router()

passwordRouter.post("/reset",authLimiter,asyncHandler(generatePassWordReset))
passwordRouter.post("/confirmation",authLimiter,validate(ConfirmPasswordResetSchema),asyncHandler(confirmPasswordReset))
