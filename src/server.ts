import { app } from "./app";

const PORT = process.env.PORT || 3000;
import dotenv from "dotenv";
dotenv.config();

import { validateEnv } from "./config.js";
validateEnv();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});