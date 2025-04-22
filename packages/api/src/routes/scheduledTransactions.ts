import { Router } from "express";
import * as scheduledTransactionController from '../controllers/scheduledTransactionController';
import { handleRequest } from "../controllers/utils";

const router = Router();

// Update a scheduled transaction
router.put(
  '/budgets/:uuid/scheduled-transactions/:transactionId',
  handleRequest(scheduledTransactionController.update)
);

// Delete a scheduled transaction
router.delete(
  '/budgets/:uuid/scheduled-transactions/:transactionId',
  handleRequest(scheduledTransactionController.remove)
);

export default router; 