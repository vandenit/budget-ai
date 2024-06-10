import { Router } from "express";
import { getAllTransactions } from "../controllers/transactionController";

const router = Router();

router.get("/", getAllTransactions);

export default router;
