import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ynabBudgetSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Budget",
  },
  serverKnowledge: {
    transactions: Number,
    categories: Number,
  },
});

const YnabBudget =
  mongoose.models.YnabBudget || model("YnabBudget", ynabBudgetSchema);
export default YnabBudget;
