import { Router } from "express";
import * as scheduledTransactionController from "../controllers/scheduledTransactionController";
import { handleRequest } from "../controllers/utils";

const router = Router();

// Get scheduled transactions for a budget
router.get(
  "/:uuid/scheduled-transactions",
  handleRequest(scheduledTransactionController.getScheduledTransactions)
);

// Create a new scheduled transaction
router.post(
  "/:uuid/scheduled-transactions",
  handleRequest(scheduledTransactionController.create)
);

// Update a scheduled transaction
router.put(
  "/:uuid/scheduled-transactions/:transactionId",
  handleRequest(scheduledTransactionController.update)
);

// Delete a scheduled transaction
router.delete(
  "/:uuid/scheduled-transactions/:transactionId",
  handleRequest(scheduledTransactionController.remove)
);

export default router;
