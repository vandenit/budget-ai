import { Request, Response } from "express";
import { getUserFromReq } from "./utils";
import { getBudget } from "../data/budget/budget.server";
import {
  getCachedAISuggestionsBatch,
  getAllCachedAISuggestionsForBudget,
  storeAISuggestion,
  getCachedAISuggestion,
  updateLocalTransactionCategory,
} from "../data/transaction/transaction.server";
import {
  getUncategorizedTransactions as getYnabUncategorizedTransactions,
  getUnapprovedTransactions as getYnabUnapprovedTransactions,
  getCategories,
  updateTransaction,
  updateTransactions,
} from "../data/ynab/ynab-api";
import { openAIService } from "../services/openai.service";
import { createPayeeMappingsService } from "../services/payeeMappings.service";

/**
 * Helper function to update local transactions after YNAB updates
 * Reduces duplicate code across apply functions
 */
const updateLocalTransactionsAfterYnabUpdate = async (
  budgetId: string,
  transactions: Array<{ id: string; category_id: string }>
) => {
  for (const transaction of transactions) {
    try {
      await updateLocalTransactionCategory(
        budgetId,
        transaction.id,
        transaction.category_id
      );
      console.log(`Updated local transaction ${transaction.id} with category`);
    } catch (error) {
      console.warn(
        `Failed to update local transaction ${transaction.id}:`,
        error
      );
    }
  }
};

/**
 * Get uncategorized transactions for a budget via YNAB API
 * Migrated from Python mathapi: GET /uncategorised-transactions
 */
export const getUncategorizedTransactionsForBudget = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    // Use YNAB API to get uncategorized transactions (like Python implementation)
    const transactions = await getYnabUncategorizedTransactions(
      budgetUuid,
      user
    );

    // Get cached AI suggestions for these transactions (like Python implementation)
    const transactionIds = transactions.map((tx) => tx.id);
    const cachedSuggestions = await getCachedAISuggestionsBatch(
      budget._id.toString(),
      transactionIds
    );

    // Transform to match Python API format with cached suggestions
    const formattedTransactions = transactions.map((transaction) => ({
      transaction_id: transaction.id,
      payee_name: transaction.payee_name || "",
      amount: transaction.amount,
      date: transaction.date,
      memo: transaction.memo || "",
      category_name: null,
      category_id: null,
      approved: transaction.approved || false,
      ai_suggested_category: cachedSuggestions[transaction.id] || null,
    }));

    console.log(
      `Returned ${formattedTransactions.length} uncategorized transactions for budget ${budgetUuid}`
    );
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching uncategorized transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get unapproved transactions for a budget via YNAB API
 * Migrated from Python mathapi: GET /unapproved-transactions
 */
export const getUnapprovedTransactionsForBudget = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    // Use YNAB API to get unapproved transactions (like Python implementation)
    const transactions = await getYnabUnapprovedTransactions(budgetUuid, user);

    // Transform to match Python API format
    const formattedTransactions = transactions.map((transaction) => ({
      transaction_id: transaction.id,
      payee_name: transaction.payee_name || "",
      amount: transaction.amount,
      date: transaction.date,
      memo: transaction.memo || "",
      category_name: transaction.category_name || null,
      category_id: transaction.category_id || null,
      approved: transaction.approved || false,
    }));

    console.log(
      `Returned ${formattedTransactions.length} unapproved transactions for budget ${budgetUuid}`
    );
    res.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching unapproved transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get cached AI suggestions for a budget
 * Migrated from Python mathapi: GET /uncategorised-transactions/suggestions-cached
 */
export const getCachedSuggestionsForBudget = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    const suggestions = await getAllCachedAISuggestionsForBudget(
      budget._id.toString()
    );

    console.log(
      `Returned ${suggestions.length} cached suggestions for budget ${budgetUuid}`
    );
    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching cached suggestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get AI suggestion for a single transaction (real-time)
 * Migrated from Python mathapi: POST /uncategorised-transactions/suggest-single
 */
export const suggestSingleTransaction = async (req: Request, res: Response) => {
  try {
    console.log(
      `🔍 suggestSingleTransaction called for budget ${req.params.uuid}`
    );
    console.log(`📝 Request body:`, JSON.stringify(req.body, null, 2));

    const user = await getUserFromReq(req);
    if (!user) {
      console.log("❌ Unauthorized - no user found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      console.log(`❌ Budget ${budgetUuid} not found or access denied`);
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    const { transaction_id, transaction } = req.body;
    console.log(
      `🔍 Extracted from body: transaction_id=${transaction_id}, transaction=${
        transaction ? "provided" : "not provided"
      }`
    );
    console.log(`🔍 Full req.body keys:`, Object.keys(req.body || {}));

    if (!transaction_id) {
      console.log("❌ transaction_id is required but not provided");
      return res.status(400).json({ error: "transaction_id is required" });
    }

    const transactionId = transaction_id;
    const startTime = Date.now();

    // Check cache first
    const cachedSuggestion = await getCachedAISuggestion(
      budget._id.toString(),
      transactionId
    );

    if (cachedSuggestion) {
      return res.json({
        transaction_id: transactionId,
        suggested_category_name: cachedSuggestion,
        confidence: 0.8,
        cached: true,
        processing_time_ms: 0,
      });
    }

    // Check if OpenAI is available
    if (!openAIService.isAvailable()) {
      return res.status(503).json({
        error: "AI service not available - API key missing",
      });
    }

    // Get transaction data if not provided
    let transactionData = transaction;
    if (!transactionData) {
      // Get uncategorized transactions to find the specific transaction
      const uncategorizedTransactions = await getYnabUncategorizedTransactions(
        budgetUuid,
        user
      );

      const foundTransaction = uncategorizedTransactions.find(
        (tx) => tx.id === transactionId
      );
      if (!foundTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      transactionData = {
        id: foundTransaction.id,
        payee_name: foundTransaction.payee_name || "",
        amount: foundTransaction.amount,
        date: foundTransaction.date,
        memo: foundTransaction.memo || "",
      };
    }

    // Get categories for this budget
    const categoriesData = await getCategories(budgetUuid, 0, user);
    const categories = categoriesData.categories;

    // Get payee mappings context
    const payeeMappingsService = createPayeeMappingsService(
      budget._id.toString()
    );
    const mappingsContext = await payeeMappingsService.getMappingsForPrompt();

    // Generate new suggestion using OpenAI
    const suggestedCategory = await openAIService.suggestCategory(
      transactionData,
      categories,
      mappingsContext
    );

    const processingTime = Date.now() - startTime;

    // Cache the new suggestion
    try {
      await storeAISuggestion(
        budget._id.toString(),
        transactionId,
        transactionData.payee_name || "",
        suggestedCategory,
        0.8
      );
    } catch (error) {
      console.warn(`Failed to cache suggestion for ${transactionId}:`, error);
    }

    res.json({
      transaction_id: transactionId,
      suggested_category_name: suggestedCategory,
      confidence: 0.8,
      cached: false,
      processing_time_ms: processingTime,
    });
  } catch (error) {
    console.error("❌ Error getting single suggestion:", error);
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error("❌ Request details:", {
      budgetUuid: req.params.uuid,
      body: req.body,
      headers: req.headers,
    });
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get AI suggestions for multiple transactions asynchronously
 * Migrated from Python mathapi: POST /uncategorised-transactions/suggestions-async
 */
export const getSuggestionsAsync = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    const { transaction_ids } = req.body;
    if (!transaction_ids || !Array.isArray(transaction_ids)) {
      return res.status(400).json({
        error: "transaction_ids required in request body",
      });
    }

    console.log(
      `Processing ${transaction_ids.length} transaction IDs for async suggestions`
    );

    // Check if OpenAI is available
    if (!openAIService.isAvailable()) {
      return res.status(503).json({
        error: "AI service not available - API key missing",
      });
    }

    // Get uncategorized transactions from YNAB
    const uncategorizedTransactions = await getYnabUncategorizedTransactions(
      budgetUuid,
      user
    );

    // Filter to only requested transactions
    const requestedTransactions = uncategorizedTransactions.filter((tx) =>
      transaction_ids.includes(tx.id)
    );

    if (requestedTransactions.length === 0) {
      return res.json({
        message: "No matching transactions found",
        processed: 0,
        cached: 0,
      });
    }

    // Get categories for this budget
    const categoriesData = await getCategories(budgetUuid, 0, user);
    const categories = categoriesData.categories;

    // Get payee mappings context
    const payeeMappingsService = createPayeeMappingsService(
      budget._id.toString()
    );
    const mappingsContext = await payeeMappingsService.getMappingsForPrompt();

    let processedCount = 0;
    let cachedCount = 0;

    // Process transactions in parallel (but limit concurrency)
    const batchSize = 5; // Process 5 at a time to avoid rate limits
    for (let i = 0; i < requestedTransactions.length; i += batchSize) {
      const batch = requestedTransactions.slice(i, i + batchSize);

      const promises = batch.map(async (transaction) => {
        try {
          // Check cache first
          const cachedSuggestion = await getCachedAISuggestion(
            budget._id.toString(),
            transaction.id
          );

          if (cachedSuggestion) {
            cachedCount++;
            return;
          }

          // Generate new suggestion
          const suggestedCategory = await openAIService.suggestCategory(
            {
              payee_name: transaction.payee_name || "",
              amount: transaction.amount,
              date: transaction.date,
            },
            categories,
            mappingsContext
          );

          // Store the suggestion
          await storeAISuggestion(
            budget._id.toString(),
            transaction.id,
            transaction.payee_name || "",
            suggestedCategory,
            0.8
          );

          processedCount++;
        } catch (error) {
          console.error(
            `Error processing transaction ${transaction.id}:`,
            error
          );
        }
      });

      await Promise.all(promises);
    }

    res.json({
      message: `Processed ${processedCount} transactions, ${cachedCount} from cache`,
      processed: processedCount,
      cached: cachedCount,
      total_requested: transaction_ids.length,
    });
  } catch (error) {
    console.error("Error getting async suggestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Apply category for a single transaction
 * Migrated from Python mathapi: POST /uncategorised-transactions/apply-single
 */
export const applySingleCategory = async (req: Request, res: Response) => {
  try {
    console.log(
      `🔍 applySingleCategory - req.body keys:`,
      Object.keys(req.body || {})
    );

    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    const { transaction_id, category_name, is_manual_change } = req.body;
    if (!transaction_id || !category_name) {
      return res.status(400).json({
        error: "transaction_id and category_name are required",
      });
    }

    // Get categories to find the category ID
    const categoriesData = await getCategories(budgetUuid, 0, user);
    const category = categoriesData.categories.find(
      (cat) => cat.name === category_name
    );

    if (!category) {
      return res.status(400).json({
        error: `Category '${category_name}' not found`,
      });
    }

    // Update transaction in YNAB
    const updatedTransaction = await updateTransaction(
      budgetUuid,
      transaction_id,
      {
        category_id: category.id,
      },
      user
    );

    // Also update local transaction for immediate consistency
    await updateLocalTransactionsAfterYnabUpdate(budget._id.toString(), [
      { id: transaction_id, category_id: category.id },
    ]);

    // Learn from manual changes (if specified)
    if (is_manual_change) {
      try {
        const payeeMappingsService = createPayeeMappingsService(
          budget._id.toString()
        );
        await payeeMappingsService.learnFromTransaction(
          updatedTransaction.payee_name || "",
          category_name,
          1.0 // High confidence for manual changes
        );
        console.log(
          `Learned from manual change: ${updatedTransaction.payee_name} -> ${category_name}`
        );
      } catch (error) {
        console.warn("Failed to learn from manual change:", error);
      }
    }

    res.json({
      message: "Transaction updated successfully",
      transaction_id: transaction_id,
      category_name: category_name,
      updated_transaction: {
        id: updatedTransaction.id,
        category_id: updatedTransaction.category_id,
        category_name: updatedTransaction.category_name,
        payee_name: updatedTransaction.payee_name,
      },
    });
  } catch (error) {
    console.error("Error applying single category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Approve a single transaction
 * Migrated from Python mathapi: POST /transactions/approve-single
 */
export const approveSingleTransaction = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    const { transaction_id } = req.body;
    if (!transaction_id) {
      return res.status(400).json({
        error: "transaction_id is required",
      });
    }

    // Update transaction to approved in YNAB
    const updatedTransaction = await updateTransaction(
      budgetUuid,
      transaction_id,
      {
        approved: true,
      },
      user
    );

    res.json({
      message: "Transaction approved successfully",
      transaction_id: transaction_id,
      updated_transaction: {
        id: updatedTransaction.id,
        approved: updatedTransaction.approved,
        payee_name: updatedTransaction.payee_name,
      },
    });
  } catch (error) {
    console.error("Error approving single transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Approve all unapproved transactions
 * Migrated from Python mathapi: POST /transactions/approve-all
 */
export const approveAllTransactions = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    // Get all unapproved transactions
    const unapprovedTransactions = await getYnabUnapprovedTransactions(
      budgetUuid,
      user
    );

    if (unapprovedTransactions.length === 0) {
      return res.json({
        message: "No unapproved transactions found",
        approved_count: 0,
      });
    }

    // Prepare transactions for bulk update
    const transactionsToUpdate = unapprovedTransactions.map((tx) => ({
      id: tx.id,
      approved: true,
    }));

    // Update all transactions in YNAB
    const updatedTransactions = await updateTransactions(
      budgetUuid,
      transactionsToUpdate,
      user
    );

    res.json({
      message: `Approved ${updatedTransactions.length} transactions successfully`,
      approved_count: updatedTransactions.length,
      updated_transactions: updatedTransactions.map((tx) => ({
        id: tx.id,
        approved: tx.approved,
        payee_name: tx.payee_name,
      })),
    });
  } catch (error) {
    console.error("Error approving all transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Apply categories for multiple transactions
 * Migrated from Python mathapi: POST /uncategorised-transactions/apply-categories
 */
export const applyCategories = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: "transactions array is required",
      });
    }

    // Get categories to validate category names
    const categoriesData = await getCategories(budgetUuid, 0, user);
    const categories = categoriesData.categories;

    // Prepare transactions for bulk update
    const transactionsToUpdate = [];
    const payeeMappingsService = createPayeeMappingsService(
      budget._id.toString()
    );

    for (const transaction of transactions) {
      const { transaction_id, category_name, is_manual_change } = transaction;

      if (!transaction_id || !category_name) {
        continue; // Skip invalid transactions
      }

      // Find category ID
      const category = categories.find((cat) => cat.name === category_name);
      if (!category) {
        console.warn(
          `Category '${category_name}' not found for transaction ${transaction_id}`
        );
        continue;
      }

      transactionsToUpdate.push({
        id: transaction_id,
        category_id: category.id,
      });

      // Learn from manual changes
      if (is_manual_change) {
        try {
          await payeeMappingsService.learnFromTransaction(
            transaction.payee_name || "",
            category_name,
            1.0
          );
        } catch (error) {
          console.warn(
            `Failed to learn from transaction ${transaction_id}:`,
            error
          );
        }
      }
    }

    if (transactionsToUpdate.length === 0) {
      return res.json({
        message: "No valid transactions to update",
        updated_count: 0,
      });
    }

    // Update all transactions in YNAB
    const updatedTransactions = await updateTransactions(
      budgetUuid,
      transactionsToUpdate,
      user
    );

    // Also update local transactions for immediate consistency
    await updateLocalTransactionsAfterYnabUpdate(
      budget._id.toString(),
      transactionsToUpdate
    );

    res.json({
      message: `Updated ${updatedTransactions.length} transactions successfully`,
      updated_count: updatedTransactions.length,
      updated_transactions: updatedTransactions.map((tx) => ({
        id: tx.id,
        category_id: tx.category_id,
        category_name: tx.category_name,
        payee_name: tx.payee_name,
      })),
    });
  } catch (error) {
    console.error("Error applying categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Apply all categories for uncategorized transactions
 * Migrated from Python mathapi: POST /uncategorised-transactions/apply-all-categories
 */
export const applyAllCategories = async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    // Get uncategorized transactions
    const uncategorizedTransactions = await getYnabUncategorizedTransactions(
      budgetUuid,
      user
    );

    if (uncategorizedTransactions.length === 0) {
      return res.json({
        message: "No uncategorized transactions found",
        updated_count: 0,
      });
    }

    // Get cached AI suggestions for all transactions
    const transactionIds = uncategorizedTransactions.map((tx) => tx.id);
    const cachedSuggestions = await getCachedAISuggestionsBatch(
      budget._id.toString(),
      transactionIds
    );

    // Get categories
    const categoriesData = await getCategories(budgetUuid, 0, user);
    const categories = categoriesData.categories;

    // Prepare transactions for bulk update
    const transactionsToUpdate = [];
    const payeeMappingsService = createPayeeMappingsService(
      budget._id.toString()
    );

    for (const transaction of uncategorizedTransactions) {
      // Check if we have a cached suggestion
      const suggestedCategoryName = cachedSuggestions[transaction.id];

      if (!suggestedCategoryName) {
        continue; // Skip transactions without suggestions
      }

      // Find category ID
      const category = categories.find(
        (cat) => cat.name === suggestedCategoryName
      );
      if (!category) {
        console.warn(
          `Category '${suggestedCategoryName}' not found for transaction ${transaction.id}`
        );
        continue;
      }

      transactionsToUpdate.push({
        id: transaction.id,
        category_id: category.id,
      });

      // Learn from AI suggestions (lower confidence)
      try {
        await payeeMappingsService.learnFromTransaction(
          transaction.payee_name || "",
          suggestedCategoryName,
          0.8 // Lower confidence for AI suggestions
        );
      } catch (error) {
        console.warn(
          `Failed to learn from transaction ${transaction.id}:`,
          error
        );
      }
    }

    if (transactionsToUpdate.length === 0) {
      return res.json({
        message: "No transactions with cached suggestions found",
        updated_count: 0,
      });
    }

    // Update all transactions in YNAB
    const updatedTransactions = await updateTransactions(
      budgetUuid,
      transactionsToUpdate,
      user
    );

    // Also update local transactions for immediate consistency
    await updateLocalTransactionsAfterYnabUpdate(
      budget._id.toString(),
      transactionsToUpdate
    );

    res.json({
      message: `Applied categories to ${updatedTransactions.length} transactions successfully`,
      updated_count: updatedTransactions.length,
      updated_transactions: updatedTransactions.map((tx) => ({
        id: tx.id,
        category_id: tx.category_id,
        category_name: tx.category_name,
        payee_name: tx.payee_name,
      })),
    });
  } catch (error) {
    console.error("Error applying all categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Suggest categories for all uncategorized transactions
 * Migrated from Python mathapi: GET /uncategorised-transactions/suggest-categories
 */
export const suggestCategoriesForUncategorized = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const budgetUuid = req.params.uuid;
    const budget = await getBudget(budgetUuid, user);
    if (!budget) {
      return res
        .status(404)
        .json({ error: "Budget not found or access denied" });
    }

    // Get uncategorized transactions from YNAB
    const uncategorizedTransactions = await getYnabUncategorizedTransactions(
      budgetUuid,
      user
    );

    if (uncategorizedTransactions.length === 0) {
      return res.json([]); // No uncategorized transactions found
    }

    // Get cached AI suggestions for these transactions
    const transactionIds = uncategorizedTransactions.map((tx) => tx.id);
    const cachedSuggestions = await getCachedAISuggestionsBatch(
      budget._id.toString(),
      transactionIds
    );

    // Get categories for AI suggestions
    const categoriesData = await getCategories(budgetUuid, 0, user);
    const categories = categoriesData.categories;

    // Prepare results and track new suggestions needed
    const suggestedTransactions = [];
    const transactionsNeedingSuggestions = [];
    const payeeMappingsService = createPayeeMappingsService(
      budget._id.toString()
    );

    for (const transaction of uncategorizedTransactions) {
      const transactionId = transaction.id;

      // Check if we have a cached suggestion
      const cachedSuggestion = cachedSuggestions[transactionId];

      if (cachedSuggestion) {
        // Use cached suggestion
        suggestedTransactions.push({
          transaction_id: transactionId,
          payee_name: transaction.payee_name || "",
          amount: transaction.amount,
          date: transaction.date,
          memo: transaction.memo || "",
          suggested_category_name: cachedSuggestion,
          cached: true,
        });
      } else {
        // Check payee mappings first (fast and free!)
        let suggestedCategory = null;
        try {
          suggestedCategory = await payeeMappingsService.getSuggestionForPayee(
            transaction.payee_name || ""
          );
          if (suggestedCategory) {
            console.log(
              `🎯 Pre-mapped: '${transaction.payee_name}' → '${suggestedCategory}'`
            );
          }
        } catch (error) {
          console.warn(
            `Failed to check payee mapping for ${transactionId}:`,
            error
          );
        }

        if (suggestedCategory) {
          // Use payee mapping
          suggestedTransactions.push({
            transaction_id: transactionId,
            payee_name: transaction.payee_name || "",
            amount: transaction.amount,
            date: transaction.date,
            memo: transaction.memo || "",
            suggested_category_name: suggestedCategory,
            cached: false,
          });

          // Cache this suggestion for future use
          try {
            await storeAISuggestion(
              budget._id.toString(),
              transactionId,
              transaction.payee_name || "",
              suggestedCategory,
              0.9 // High confidence for payee mappings
            );
          } catch (error) {
            console.warn(
              `Failed to cache payee mapping suggestion for ${transactionId}:`,
              error
            );
          }
        } else {
          // Need AI suggestion
          transactionsNeedingSuggestions.push(transaction);
        }
      }
    }

    // Generate AI suggestions for remaining transactions
    const newSuggestions = [];
    for (const transaction of transactionsNeedingSuggestions) {
      try {
        console.log(`Generating AI suggestion for: ${transaction.payee_name}`);

        // Get mappings context for AI prompt
        const mappingsContext =
          await payeeMappingsService.getMappingsForPrompt();

        const suggestedCategory = await openAIService.suggestCategory(
          {
            payee_name: transaction.payee_name || "",
            amount: transaction.amount,
            date: transaction.date,
          },
          categories,
          mappingsContext
        );

        suggestedTransactions.push({
          transaction_id: transaction.id,
          payee_name: transaction.payee_name || "",
          amount: transaction.amount,
          date: transaction.date,
          memo: transaction.memo || "",
          suggested_category_name: suggestedCategory,
          cached: false,
        });

        // Cache the new suggestion
        newSuggestions.push({
          transactionId: transaction.id,
          payeeName: transaction.payee_name || "",
          suggestedCategory: suggestedCategory,
          confidence: 0.8,
        });
      } catch (error) {
        console.error(
          `Failed to generate suggestion for transaction ${transaction.id}:`,
          error
        );

        // Add error entry
        suggestedTransactions.push({
          transaction_id: transaction.id,
          payee_name: transaction.payee_name || "",
          amount: transaction.amount,
          date: transaction.date,
          memo: transaction.memo || "",
          suggested_category_name: "Error generating suggestion",
          cached: false,
        });
      }
    }

    // Batch cache new suggestions
    if (newSuggestions.length > 0) {
      try {
        let cachedCount = 0;
        for (const suggestion of newSuggestions) {
          const success = await storeAISuggestion(
            budget._id.toString(),
            suggestion.transactionId,
            suggestion.payeeName,
            suggestion.suggestedCategory,
            suggestion.confidence
          );
          if (success) cachedCount++;
        }
        console.log(`Cached ${cachedCount} new suggestions`);
      } catch (error) {
        console.warn("Failed to cache new suggestions:", error);
      }
    }

    const cachedCount = Object.keys(cachedSuggestions).length;
    console.log(
      `Returned ${suggestedTransactions.length} suggestions (${cachedCount} from cache, ${newSuggestions.length} new)`
    );

    res.json(suggestedTransactions);
  } catch (error) {
    console.error("Error suggesting categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
