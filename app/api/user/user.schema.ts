import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema({
  authId: { type: String, index: true },
  name: String,
  ynabConnection: {
    accessToken: String,
    refreshToken: String,
  },
  createdAt: Date,
  updatedAt: Date,
  settings: {
    preferredBudgetId: String,
  },
});

const User = mongoose.models.User || model("User", userSchema);
export default User;
