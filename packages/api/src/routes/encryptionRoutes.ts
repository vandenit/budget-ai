/**
 * Routes for end-to-end encryption endpoints
 */

import { Router } from "express";
import {
  handleGetServerPublicKey,
  handleSaveUserPublicKey,
  handleGetUserPublicKey,
  handleCheckEncryptionSetup,
} from "../controllers/encryptionController";
import { handleRequest } from "../controllers/utils";

const router = Router();

/**
 * GET /encryption/server-public-key
 * Get server's public key (no auth required)
 */
router.get("/server-public-key", handleRequest(handleGetServerPublicKey));

/**
 * POST /encryption/public-key
 * Save user's public key (auth required)
 */
router.post("/public-key", handleRequest(handleSaveUserPublicKey));

/**
 * GET /encryption/public-key
 * Get user's public key (auth required)
 */
router.get("/public-key", handleRequest(handleGetUserPublicKey));

/**
 * GET /encryption/setup-status
 * Check if user has encryption set up (auth required)
 */
router.get("/setup-status", handleRequest(handleCheckEncryptionSetup));

export default router;
