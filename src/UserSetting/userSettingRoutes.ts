import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { EditUserSettingSchema } from "./schema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { editUserSetting, findUserSettingByUserId } from "./userSettingService.js";

export const userSettingsRouter= Router()

userSettingsRouter.put("/",authMiddleware,validate(EditUserSettingSchema),asyncHandler(editUserSetting))

userSettingsRouter.get("/",authMiddleware,asyncHandler(findUserSettingByUserId))