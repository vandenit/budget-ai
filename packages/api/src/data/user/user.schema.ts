import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema({
  authId: { type: String, index: true },
  name: String,
  ynab: {
    connection: {
      accessToken: String,
      refreshToken: String,
    },
  },
  createdAt: Date,
  updatedAt: Date,
  settings: {
    preferredBudgetUuid: String,
  },
  syncDate: Date,
  // End-to-end encryption
  encryption: {
    publicKey: String, // User's RSA public key (PEM format)
    version: { type: Number, default: 1 }, // Encryption version for future upgrades
  },
});

const User = mongoose.models.User || model("User", userSchema);
export default User;
