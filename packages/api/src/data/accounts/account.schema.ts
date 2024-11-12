import mongoose, { model, Schema } from "mongoose";

export type LocalAccountType = {
  _id?: string;

  uuid: string;

  name: string;
  /**
   * The current balance of the account in milliunits format
   * @type {number}
   * @memberof Account
   */
  balance: number;
  /**
   * The current cleared balance of the account in milliunits format
   * @type {number}
   * @memberof Account
   */
  cleared_balance: number;
  /**
   * The current uncleared balance of the account in milliunits format
   * @type {number}
   * @memberof Account
   */
  uncleared_balance: number;

  budgetId: string;
};

const localAccountSchema = new Schema({
  uuid: { type: String, index: true, unique: true },
  name: String,
  balance: Number,
  cleared_balance: Number,
  uncleared_balance: Number,
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocalBudget",
  },
});

export const LocalAccount =
  mongoose.models.LocalAccount || model("LocalAccount", localAccountSchema);
