import mongoose from "mongoose";
import { number } from "prop-types";
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
};

const localCategorySchema = new Schema({
  uuid: { type: String, index: true, unique: true },
  name: String,
  balance: Number,
  budgeted: Number,
  activity: Number,
  targetAmount: Number,
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocalCategory",
  },
});

export const LocalCategory =
  mongoose.models.LocalCategory || model("LocalCategory", localCategorySchema);
