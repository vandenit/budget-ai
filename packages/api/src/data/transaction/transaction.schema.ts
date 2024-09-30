import mongoose from "mongoose";
const { Schema, model } = mongoose;

const localTransactionSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  uuid: { type: String, index: true, unique: true },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocalBudget",
  },
  accountName: String,
  amount: Number,
  date: String,
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocalCategory",
    nullable: true,
  },
  payeeName: String,
  memo: String,
});

export const LocalTransaction =
  mongoose.models.LocalTransaction ||
  model("LocalTransaction", localTransactionSchema);
