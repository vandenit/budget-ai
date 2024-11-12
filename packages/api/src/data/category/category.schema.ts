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
  target: {
    goal_type: {
      type: String,
      enum: ["TB", "TBD", "MF", "NEED", "DEBT"],
      default: null,
    }, // Type van doel
    goal_day: { type: Number, default: null }, // Dag offset voor de doel-vervaldatum
    goal_cadence: { type: Number, default: null }, // Cadans van het doel (0-14)
    goal_cadence_frequency: { type: Number, default: null }, // Frequentie modifier voor de cadans
    goal_creation_month: { type: String, default: null }, // Creatiemaand van het doel (bijv. "2024-01")
    goal_target: { type: Number, default: null }, // Doelbedrag in milliunits
    goal_target_month: { type: String, default: null }, // Doelmaand voor voltooiing van het doel
    goal_percentage_complete: { type: Number, default: null }, // Percentage voltooiing van het doel
    goal_months_to_budget: { type: Number, default: null }, // Aantal maanden over in de huidige doelperiode
    goal_under_funded: { type: Number, default: null }, // Bedrag dat nodig is voor deze maand om op schema te blijven
    goal_overall_funded: { type: Number, default: null }, // Totale hoeveelheid gefinancierd voor het doel
    goal_overall_left: { type: Number, default: null }, // Bedrag dat nog nodig is om het doel te bereiken
  },
});

const categoryHistorySchema = new Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "LocalCategory" },
  activity: Number,
  month: { type: String, index: true },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocalBudget",
  },
});

// combination categoryId month is unique
categoryHistorySchema.index({ categoryId: 1, month: 1 }, { unique: true });

export const LocalCategory =
  mongoose.models.LocalCategory || model("LocalCategory", localCategorySchema);

export const LocalCategoryHistory =
  mongoose.models.CategoryHistory ||
  model("CategoryHistory", categoryHistorySchema);
