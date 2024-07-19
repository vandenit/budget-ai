import mongoose from "mongoose";
const { Schema, model } = mongoose;

export type LocalCategoryType = {
  _id?: string;
  name: string;
  uuid: string;
  balance: number;
  budgeted: number;
  activity: number;
  targetAmount: number;
  budgetId: mongoose.Schema.Types.ObjectId;
  typicalSpendingPattern: number;
  historicalAverage: number;
};

const localCategorySchema = new Schema({
  uuid: { type: String, index: true, unique: true },
  name: String,
  balance: Number,
  budgeted: Number,
  activity: Number,
  targetAmount: Number,
  historicalAverage: Number,
  typicalSpendingPattern: Number,
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocalBudget",
  },
});

const categoryHistorySchema = new Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LocalCategory" },
  activity: Number,
  month: { type: String, index: true },
});

// combination categoryId month is unique
categoryHistorySchema.index({ categoryId: 1, month: 1 }, { unique: true });

export const LocalCategory =
  mongoose.models.LocalCategory || model("LocalCategory", localCategorySchema);

export const LocalCategoryHistory =
  mongoose.models.CategoryHistory ||
  model("CategoryHistory", categoryHistorySchema);
