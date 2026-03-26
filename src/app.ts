import express, { Application } from "express";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/exceptions.js";
import { userRouter } from "./user/userRoutes.js";
import { passwordRouter } from "./passwords/passwordRoutes.js";
import { homeRouter } from "./homes/homeRoutes.js";
import { roomsRouter } from "./rooms/roomRoutes.js";
import { assetRouter } from "./assets/assetsRoutes.js";

dotenv.config();

export const app: Application = express();

app.use(express.json());
app.use("/api/v1/users",userRouter)
app.use("/api/v1/passwords",passwordRouter)
app.use("/api/v1/homes",homeRouter)
app.use("/api/v1/rooms",roomsRouter)
app.use("/api/v1/assets",assetRouter)
app.use(errorHandler)