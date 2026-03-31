import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { confirmPasswordReset, generatePassWordReset } from "./passwordService.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { ConfirmPasswordResetSchema } from "./schema.js";
import { sensitiveRouteLimiter } from "../middleware/ratelimtiMiddleware.js";

export const passwordRouter=Router()

passwordRouter.post("/reset",sensitiveRouteLimiter,asyncHandler(generatePassWordReset))
passwordRouter.post("/confirmation",sensitiveRouteLimiter,validate(ConfirmPasswordResetSchema),asyncHandler(confirmPasswordReset))
