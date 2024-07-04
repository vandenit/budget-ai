import { Router } from "express";
import {
  handleConnectUserWithYnab,
  handleCreateOrUpdateUser,
  handleGetLoggedInUser,
  handleSavePreferredBudget,
} from "../controllers/userController";
import { handleRequest } from "../controllers/utils";

const router = Router();

router.get("/logged-in", handleGetLoggedInUser);
router.put("/", handleCreateOrUpdateUser);
router.put("/connect-ynab", handleConnectUserWithYnab);

// users/preferred-budget
router.put("/preferred-budget", handleRequest(handleSavePreferredBudget));

export default router;
