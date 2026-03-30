import { Router } from "express";
import { logout, refresh } from "./refreshService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const refreshRouter=Router()

refreshRouter.post("/",asyncHandler(refresh))

refreshRouter.post("/logout",asyncHandler(logout))

