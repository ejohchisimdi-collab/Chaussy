import express, { Application } from "express";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/exceptions.js";
import { userRouter } from "./user/userRoutes.js";

dotenv.config();

export const app: Application = express();

app.use(express.json());
app.use("/api/v1/users",userRouter)

app.use(errorHandler)