import connectDb from "../db";
import { LocalTransaction } from "./transaction.schema";
import { Transaction } from "common-ts";
import { extractPayeeName } from "./utils";

export type NewOrUpdatedTransaction = {
  accountName: string;
  amount: number;
  date: string;
  categoryId: string | undefined | null;
  payeeName: string | undefined | null;
  memo: string | undefined | null;
};

const TRANSACTION_LIMIT = 10000;
/**
 * Finds transactions based on the provided budgetId and date filter.
 * If a date filter is provided, it will return transactions for the specified month (YYYY-MM format) or for the specified year with format YYYY.
 * If no date filter is provided, it will return all transactions with a limit of TRANSACTION_LIMIT
 * @param budgetId - The ID of the budget to search for transactions.
 * @param dateFilterString - Optional. The date filter string in either YYYY-MM or YYYY format.
 * @returns A promise that resolves to an array of transactions.
 */
export const findTransactions = async (
  budgetId: string,
  dateFilterString?: string // YYYY-MM for transactions of 1 month or YYYY for all of 1 year
): Promise<Transaction[]> => {
  await connectDb();
  console.log("find transactions:" + budgetId + "/" + dateFilterString);

  // find transactions with month with format YYYY-MM or include all if month empty
  const dateFilter = dateFilterString
    ? { $regex: `^${dateFilterString}` }
    : { $exists: true };
  const filter = {
    budgetId,
    date: dateFilter,
  };
  console.log("filter?" + JSON.stringify(filter));
  const localTransactions = await LocalTransaction.find(filter).sort({
    date: -1,
  });
  return localTransactions.map((transaction) => ({
    uuid: transaction.uuid,
    accountName: transaction.accountName,
    amount: transaction.amount,
    date: transaction.date,
    categoryId: transaction.categoryId,
    payeeName: transaction.payeeName,
    cleanPayeeName: extractPayeeName(transaction.payeeName),
    memo: transaction.memo,
  }));
};

// todo refactor to have bulk inserts, updates and deletes
export const insertOrUpdateMissingTransaction = async (
  uuid: string,
  deleted: boolean,
  budgetId: string,
  newData: NewOrUpdatedTransaction
) => {
  const localTransaction = await LocalTransaction.findOne({ uuid });
  if (!localTransaction && !deleted) {
    const newLocalTransaction = new LocalTransaction({
      uuid,
      budgetId: budgetId,
      ...newData,
    });
    await newLocalTransaction.save();
  } else if (localTransaction) {
    if (deleted) {
      await LocalTransaction.deleteOne({ uuid }).exec();
      return;
    }
    await LocalTransaction.updateOne({ uuid }, newData).exec();
  }
};

/**
 * Get uncategorized transactions (transactions without a category)
 */
export const getUncategorizedTransactions = async (
  budgetId: string
): Promise<Transaction[]> => {
  await connectDb();

  const localTransactions = await LocalTransaction.find({
    budgetId,
    $or: [{ categoryId: null }, { categoryId: undefined }, { categoryId: "" }],
  }).sort({ date: -1 });

  return localTransactions.map((transaction) => ({
    uuid: transaction.uuid,
    accountName: transaction.accountName,
    amount: transaction.amount,
    date: transaction.date,
    categoryId: transaction.categoryId,
    payeeName: transaction.payeeName,
    cleanPayeeName: extractPayeeName(transaction.payeeName),
    memo: transaction.memo,
  }));
};

/**
 * Get cached AI suggestion for a transaction
 * Uses same field structure as Python SimpleAISuggestionsService
 */
export const getCachedAISuggestion = async (
  budgetId: string,
  transactionId: string
): Promise<string | null> => {
  await connectDb();

  const transaction = await LocalTransaction.findOne({
    budgetId,
    uuid: transactionId,
    ai_suggested_category: { $exists: true, $ne: null },
  });

  if (transaction?.ai_suggested_category) {
    // Check if suggestion is not too old (7 days, same as Python)
    const suggestionDate = transaction.ai_suggestion_date;
    if (suggestionDate) {
      const age = Date.now() - suggestionDate.getTime();
      const daysDiff = age / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        return transaction.ai_suggested_category;
      }
      return null; // Expired
    }
    // Old suggestion without date - still valid
    return transaction.ai_suggested_category;
  }

  return null;
};

/**
 * Get cached AI suggestions for multiple transactions
 * Uses same logic as Python SimpleAISuggestionsService.get_cached_suggestions_batch
 */
export const getCachedAISuggestionsBatch = async (
  budgetId: string,
  transactionIds: string[]
): Promise<Record<string, string>> => {
  await connectDb();

  const transactions = await LocalTransaction.find({
    budgetId,
    uuid: { $in: transactionIds },
    ai_suggested_category: { $exists: true, $ne: null },
  });

  const result: Record<string, string> = {};
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  transactions.forEach((transaction) => {
    const suggestionDate = transaction.ai_suggestion_date;

    // Check if not expired (or no date = keep it, same as Python)
    if (!suggestionDate || suggestionDate >= cutoffDate) {
      result[transaction.uuid] = transaction.ai_suggested_category;
    }
  });

  return result;
};

/**
 * Get all cached AI suggestions for a budget
 * Returns all cached suggestions without filtering by transaction IDs
 */
export const getAllCachedAISuggestionsForBudget = async (budgetId: string) => {
  await connectDb();

  const transactions = await LocalTransaction.find({
    budgetId,
    ai_suggested_category: { $exists: true, $ne: null },
  })
    .sort({ ai_suggestion_date: -1 })
    .limit(1000);

  return transactions.map((transaction) => ({
    transaction_id: transaction.uuid,
    payee_name: transaction.payeeName ?? "",
    suggested_category_name: transaction.ai_suggested_category ?? "",
    confidence: transaction.ai_suggestion_confidence ?? 0.8,
    cached_at: transaction.ai_suggestion_date ?? new Date(),
  }));
};

/**
 * Store AI suggestion for a transaction
 * Uses same logic as Python SimpleAISuggestionsService.store_suggestion
 */
export const storeAISuggestion = async (
  budgetId: string,
  transactionId: string,
  payeeName: string,
  suggestedCategory: string,
  confidence: number = 0.8
): Promise<boolean> => {
  await connectDb();

  try {
    // Try to update existing transaction
    const result = await LocalTransaction.findOneAndUpdate(
      { budgetId, uuid: transactionId },
      {
        $set: {
          ai_suggested_category: suggestedCategory,
          ai_suggestion_date: new Date(),
          ai_suggestion_confidence: confidence,
        },
      },
      { upsert: false }
    );

    if (result) {
      return true;
    } else {
      // Transaction might not exist in local collection yet
      // Create a minimal document for caching (same as Python)
      await LocalTransaction.findOneAndUpdate(
        { budgetId, uuid: transactionId },
        {
          $set: {
            budgetId,
            uuid: transactionId,
            payeeName,
            ai_suggested_category: suggestedCategory,
            ai_suggestion_date: new Date(),
            ai_suggestion_confidence: confidence,
            _cache_only: true, // Mark as cache-only document
          },
        },
        { upsert: true }
      );
      return true;
    }
  } catch (error) {
    console.error("Error storing AI suggestion:", error);
    return false;
  }
};
