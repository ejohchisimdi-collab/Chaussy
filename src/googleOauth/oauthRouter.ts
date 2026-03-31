import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { googleCallback, googleRedirect } from "./oauthService.js";

export const oauthRouter=Router()
oauthRouter.get("/redirect",asyncHandler(googleRedirect))
oauthRouter.get("/callback",asyncHandler(googleCallback))