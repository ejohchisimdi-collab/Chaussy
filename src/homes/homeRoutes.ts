import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { AddHomeSchema, EditHomeSchema } from "./schema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { addHome, addHomeProfilePicture, deleteHomeProfilePicture, editHome, viewHomeByUser, viewHomeProfilePicture } from "./homesService.js";
import { uploadPhoto } from "../middleware/multerMiddleWare.js";

export const homeRouter=Router()

homeRouter.post("/",authMiddleware,validate(AddHomeSchema),asyncHandler(addHome))

homeRouter.put("/",authMiddleware,validate(EditHomeSchema),asyncHandler(editHome))

homeRouter.get("/",authMiddleware,asyncHandler(viewHomeByUser))

homeRouter.post("/profiles/:id",authMiddleware,uploadPhoto.single("file"),asyncHandler(addHomeProfilePicture))

homeRouter.delete("/profiles/:id",authMiddleware,asyncHandler(deleteHomeProfilePicture))

homeRouter.get("/profiles/:id",authMiddleware,asyncHandler(viewHomeProfilePicture))

