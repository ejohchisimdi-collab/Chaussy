import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/vallidationMiddleWare.js";
import { AddHomeSchema } from "../homes/schema.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { addRoom, editRoom, findRoomsByHomeId } from "./roomService.js";
import { AddRoomSchema, EditRoomSchema } from "./schema.js";

export const roomsRouter=Router()

roomsRouter.post("/",authMiddleware,validate(AddRoomSchema),asyncHandler(addRoom))

roomsRouter.put("/",authMiddleware,validate(EditRoomSchema),asyncHandler(editRoom))

roomsRouter.get("/:homeId",authMiddleware,asyncHandler(findRoomsByHomeId))
