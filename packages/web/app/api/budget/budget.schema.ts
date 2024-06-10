import mongoose from "mongoose";
const { Schema, model } = mongoose;

const localBudgetSchema = new Schema({
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  uuid: { type: String, index: true, unique: true },
  name: String,
});

export const LocalBudget =
  mongoose.models.LocalBudget || model("LocalBudget", localBudgetSchema);
