import mongoose from "mongoose";
import { number } from "prop-types";
const { Schema, model } = mongoose;

const userTransactionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  budgetId: String,
  lastKnowledgeOfServer: Number,
});
userTransactionSchema.index({ userId: 1, budgetId: 1 }, { unique: true });

export const UserTransaction =
  mongoose.models.UserTransaction ||
  model("UserTransaction", userTransactionSchema);

const localTransactionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  id: { type: String, index: true, unique: true },
  budgetId: { type: String, index: true },
  accountName: String,
  amount: Number,
  date: String,
  categoryName: String,
  categoryId: { type: String, index: true },
  payeeName: String,
  memo: String,
});

export const LocalTransaction =
  mongoose.models.LocalTransaction ||
  model("LocalTransaction", localTransactionSchema);
