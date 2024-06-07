import express from "express";
import cors from "cors";
const { expressjwt: jwt } = require("express-jwt");
const jwks = require("jwks-rsa");

import transactionRoutes from "./routes/transactionRoutes";
import budgetRoutes from "./routes/budgetRoutes";

const authenticate = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://vandenit.eu.auth0.com/.well-known/jwks.json",
  }),
  audience: "https://budgetai.vandenit.be",
  issuer: "https://vandenit.eu.auth0.com/",
  algorithms: ["RS256"],
});
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/budgets", authenticate, budgetRoutes);

app.use("/transactions", authenticate, transactionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
