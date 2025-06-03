import { Router } from "express";
import * as scheduledTransactionController from "../controllers/scheduledTransactionController";
import { handleRequest } from "../controllers/utils";

const router = Router();

// Get scheduled transactions for a budget
router.get(
  "/budgets/:uuid/scheduled-transactions",
  handleRequest(scheduledTransactionController.getScheduledTransactions)
);

// Update a scheduled transaction
router.put(
  "/budgets/:uuid/scheduled-transactions/:transactionId",
  handleRequest(scheduledTransactionController.update)
);

// Delete a scheduled transaction
router.delete(
  "/budgets/:uuid/scheduled-transactions/:transactionId",
  handleRequest(scheduledTransactionController.remove)
);

export default router;
