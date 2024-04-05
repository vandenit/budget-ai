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
    serverKnowledge: {
      transactions: Number,
      budgets: Number,
      categories: Number,
    },
  },
  createdAt: Date,
  updatedAt: Date,
  settings: {
    preferredBudgetUuid: String,
  },
  syncDate: Date,
});

const User = mongoose.models.User || model("User", userSchema);
export default User;
