import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-ai';

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  await mongoose.connect(MONGODB_URI);
  console.error('Connected to MongoDB');
}

// Import schemas from API package
const { Schema, model } = mongoose;

// LocalBudget Schema
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

// LocalTransaction Schema
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
  import_payee_name_original: String,
  ai_suggested_category: String,
  ai_suggestion_date: Date,
  ai_suggestion_confidence: Number,
  _cache_only: Boolean,
});

export const LocalTransaction =
  mongoose.models.LocalTransaction ||
  model("LocalTransaction", localTransactionSchema);

// LocalCategory Schema
const localCategorySchema = new Schema({
  name: String,
  uuid: { type: String, index: true },
  balance: Number,
  budgeted: Number,
  activity: Number,
  targetAmount: Number,
  typicalSpendingPattern: Number,
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocalBudget",
  },
});

export const LocalCategory =
  mongoose.models.LocalCategory || model("LocalCategory", localCategorySchema);

// LocalAccount Schema
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

// Simulation Schema
const simulationSchema = new Schema(
  {
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocalBudget",
      required: true,
    },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    categoryChanges: [
      {
        categoryUuid: { type: String, required: true },
        startDate: Date,
        endDate: Date,
        targetAmount: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Simulation =
  mongoose.models.Simulation || model("Simulation", simulationSchema);

// LocalUser Schema
const localUserSchema = new Schema({
  auth0Id: { type: String, unique: true },
  email: String,
});

export const LocalUser =
  mongoose.models.LocalUser || model("LocalUser", localUserSchema);
