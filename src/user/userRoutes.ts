import { Router } from "express";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { EditUserSchema, loginSchema, registerUserSchema } from "./schema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { deleteProfilePicture, generateEmailConfirmationCode, logIn, registerUser, updateProfile, uploadProfilePicture, verifyEmail, viewProfile, viewProfilePicture } from "./userService.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadPhoto } from "../middleware/multerMiddleWare.js";

export const userRouter=Router()

userRouter.post("/register",validate(registerUserSchema),asyncHandler(registerUser))

userRouter.post("/login",validate(loginSchema),asyncHandler(logIn))

userRouter.get("/profiles",authMiddleware,asyncHandler(viewProfile))

userRouter.put("/profiles",authMiddleware,validate(EditUserSchema),asyncHandler(updateProfile))

userRouter.post("/picture",authMiddleware,uploadPhoto.single("file"),asyncHandler(uploadProfilePicture))

userRouter.delete("/picture",authMiddleware,asyncHandler(deleteProfilePicture))

userRouter.get("/picture",authMiddleware,asyncHandler(viewProfilePicture))



userRouter.post("/email/generation",authMiddleware,asyncHandler(generateEmailConfirmationCode))

userRouter.post("/email/confirmation",authMiddleware,asyncHandler(verifyEmail))

