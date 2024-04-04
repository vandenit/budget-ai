import mongoose from "mongoose";
import { number } from "prop-types";
const { Schema, model } = mongoose;

const localBudgetSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  uuid: { type: String, index: true, unique: true },
  externalId: { type: String, index: true, unique: true },
  name: String,
});

export const LocalBudget =
  mongoose.models.LocalBudget || model("LocalBudget", localBudgetSchema);
