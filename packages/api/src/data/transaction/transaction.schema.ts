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
  // Original payee name from YNAB import (before any payee rename rules)
  import_payee_name_original: String,
  // AI suggestions caching (same as Python implementation)
  ai_suggested_category: String,
  ai_suggestion_date: Date,
  ai_suggestion_confidence: Number,
  _cache_only: Boolean, // For cache-only documents
});

export const LocalTransaction =
  mongoose.models.LocalTransaction ||
  model("LocalTransaction", localTransactionSchema);
