import express from "express";
import cors from "cors";
import transactionRoutes from "./routes/transactionRoutes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/transactions", transactionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
