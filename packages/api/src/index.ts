const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");
import express from "express";
import cors from "cors";
import register from "./metrics";
require("dotenv").config();

import budgetRoutes from "./routes/budgetRoutes";
import userRoutes from "./routes/userRoutes";
import syncRoutes from "./routes/syncRoutes";
import { overrideConsoleLog } from "common-ts";

overrideConsoleLog();

const app = express();

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
  audience:
    process.env.AUTH0_AUDIENCE || "https://vandenit.eu.auth0.com/api/v2/",
  issuerBaseURL: `https://vandenit.eu.auth0.com`,
});

// Middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/budgets", checkJwt, budgetRoutes);

app.use("/users", checkJwt, userRoutes);

app.use("/sync", syncRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Add the /metrics endpoint
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
});
