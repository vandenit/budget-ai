import { Router } from "express";
import {
  handleConnectUserWithYnab,
  handleCreateOrUpdateUser,
  handleGetLoggedInUser,
} from "../controllers/userController";

const router = Router();

router.put("/logged-in", handleGetLoggedInUser);
router.put("/", handleCreateOrUpdateUser);
router.put("/connect-ynab", handleConnectUserWithYnab);
export default router;
