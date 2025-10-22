/**
 * Server-side encryption key management
 */

import { UserType } from "../user/user.server";
import User from "../user/user.schema";
import { generateServerKeyPair, encryptWithPublicKey } from "../../encryption/server-crypto";
import crypto from "crypto";

/**
 * Generate a new RSA key pair for user (client-side equivalent)
 * This is a server-side generation for initial setup
 */
function generateUserKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { privateKey, publicKey };
}

/**
 * Ensure user has encryption key set up
 * If not, generate one automatically
 */
export async function ensureUserEncryptionKey(user: UserType): Promise<UserType> {
  // Check if user already has encryption key
  if (user.encryption?.publicKey) {
    console.log(`User ${user.authId} already has encryption key`);
    return user;
  }

  console.log(`Generating encryption key for user ${user.authId}`);

  try {
    // Generate key pair
    const { publicKey } = generateUserKeyPair();

    // Save public key to database
    await User.updateOne(
      { _id: user._id },
      {
        "encryption.publicKey": publicKey,
        "encryption.version": 1,
        updatedAt: new Date(),
      }
    );

    // Return updated user
    const updatedUser = await User.findById(user._id);
    return updatedUser as UserType;
  } catch (error) {
    console.error(`Failed to generate encryption key for user ${user.authId}:`, error);
    throw new Error("Failed to generate encryption key");
  }
}

/**
 * Get user's public key for encryption
 */
export async function getUserPublicKey(user: UserType): Promise<string> {
  if (!user.encryption?.publicKey) {
    throw new Error(`User ${user.authId} does not have encryption key set up`);
  }
  return user.encryption.publicKey;
}

/**
 * Encrypt amount with user's public key
 */
export async function encryptAmountForUser(
  amount: number,
  user: UserType
): Promise<string> {
  const publicKey = await getUserPublicKey(user);
  const amountString = amount.toString();
  return encryptWithPublicKey(amountString, publicKey);
}
