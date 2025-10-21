/**
 * Controller for end-to-end encryption endpoints
 */

import { Request, Response } from "express";
import { getUserFromReq } from "./utils";
import { saveUserPublicKey, getUserByAuthId } from "../data/user/user.server";
import { getServerPublicKey } from "../encryption/server-crypto";

/**
 * Get server's public key
 * Used by frontend to encrypt user's private key
 */
export const handleGetServerPublicKey = async (
  _req: Request,
  res: Response
) => {
  try {
    const serverPublicKey = getServerPublicKey();
    res.json({ publicKey: serverPublicKey });
  } catch (error) {
    console.error("Failed to get server public key:", error);
    res.status(500).json({
      error: "Failed to get server public key",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Save user's encryption public key
 * Called by frontend after generating key pair
 */
export const handleSaveUserPublicKey = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      console.error("no user found");
      return res.status(401).send("Unauthorized");
    }

    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ error: "publicKey is required" });
    }

    // Validate that it looks like a PEM public key
    if (!publicKey.includes("BEGIN PUBLIC KEY")) {
      return res.status(400).json({ error: "Invalid public key format" });
    }

    await saveUserPublicKey(user.authId, publicKey);

    res.json({ success: true, message: "Public key saved" });
  } catch (error) {
    console.error("Failed to save user public key:", error);
    res.status(500).json({
      error: "Failed to save public key",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get user's public key
 * Used by sync service to encrypt amounts
 */
export const handleGetUserPublicKey = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      console.error("no user found");
      return res.status(401).send("Unauthorized");
    }

    const publicKey = user.encryption?.publicKey;
    if (!publicKey) {
      return res.status(404).json({
        error: "User has not set up encryption yet",
      });
    }

    res.json({ publicKey });
  } catch (error) {
    console.error("Failed to get user public key:", error);
    res.status(500).json({
      error: "Failed to get public key",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Check if user has encryption set up
 */
export const handleCheckEncryptionSetup = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      console.error("no user found");
      return res.status(401).send("Unauthorized");
    }

    const hasEncryption = !!user.encryption?.publicKey;

    res.json({
      hasEncryption,
      version: user.encryption?.version || 0,
    });
  } catch (error) {
    console.error("Failed to check encryption setup:", error);
    res.status(500).json({
      error: "Failed to check encryption setup",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
