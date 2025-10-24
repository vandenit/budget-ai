#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import {
  connectDB,
  LocalBudget,
  LocalTransaction,
  LocalCategory,
  LocalAccount,
  Simulation,
  LocalUser,
} from './db.js';
import {
  formatAmount,
  formatTransaction,
  formatCategory,
  formatAccount,
} from './formatters.js';

dotenv.config();

// Tool definitions
const GET_BUDGETS_TOOL: Tool = {
  name: 'get_budgets',
  description: 'List all budgets accessible to the user. Returns budget names and UUIDs.',
  inputSchema: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'User ID (MongoDB ObjectId) - optional for development',
      },
    },
  },
};

const GET_TRANSACTIONS_TOOL: Tool = {
  name: 'get_transactions',
  description:
    'Get transactions with optional filters. Can filter by date range, category, payee, amount range, and more.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
      startDate: {
        type: 'string',
        description: 'Start date (YYYY-MM-DD) - optional',
      },
      endDate: {
        type: 'string',
        description: 'End date (YYYY-MM-DD) - optional',
      },
      categoryName: {
        type: 'string',
        description: 'Filter by category name - optional',
      },
      payeeName: {
        type: 'string',
        description: 'Filter by payee name (partial match) - optional',
      },
      minAmount: {
        type: 'number',
        description: 'Minimum amount in dollars - optional',
      },
      maxAmount: {
        type: 'number',
        description: 'Maximum amount in dollars - optional',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of transactions to return (default: 50)',
      },
    },
    required: ['budgetUuid'],
  },
};

const GET_BUDGET_SUMMARY_TOOL: Tool = {
  name: 'get_budget_summary',
  description:
    'Get a summary of budget categories with their budgeted amounts, activity, and balances for a specific month.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
      month: {
        type: 'string',
        description: 'Month in YYYY-MM format (default: current month)',
      },
    },
    required: ['budgetUuid'],
  },
};

const GET_CATEGORIES_TOOL: Tool = {
  name: 'get_categories',
  description:
    'List all categories in a budget with their current balances, budgeted amounts, and targets.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
    },
    required: ['budgetUuid'],
  },
};

const GET_ACCOUNTS_TOOL: Tool = {
  name: 'get_accounts',
  description:
    'Get all accounts in a budget with their balances (cleared and uncleared).',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
    },
    required: ['budgetUuid'],
  },
};

const GET_UNCATEGORIZED_TOOL: Tool = {
  name: 'get_uncategorized_transactions',
  description:
    'Get all transactions that have not been assigned a category.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of transactions to return (default: 50)',
      },
    },
    required: ['budgetUuid'],
  },
};

const GET_SIMULATIONS_TOOL: Tool = {
  name: 'get_simulations',
  description:
    'List all budget simulations (what-if scenarios) for a budget.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
      activeOnly: {
        type: 'boolean',
        description: 'Only return active simulations (default: false)',
      },
    },
    required: ['budgetUuid'],
  },
};

const CATEGORIZE_TRANSACTION_TOOL: Tool = {
  name: 'categorize_transaction',
  description: 'Assign a category to a transaction.',
  inputSchema: {
    type: 'object',
    properties: {
      transactionUuid: {
        type: 'string',
        description: 'Transaction UUID (required)',
      },
      categoryUuid: {
        type: 'string',
        description: 'Category UUID to assign (required)',
      },
    },
    required: ['transactionUuid', 'categoryUuid'],
  },
};

const CREATE_SIMULATION_TOOL: Tool = {
  name: 'create_simulation',
  description:
    'Create a new budget simulation to test what-if scenarios.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
      name: {
        type: 'string',
        description: 'Name for the simulation (required)',
      },
      categoryChanges: {
        type: 'array',
        description: 'Array of category changes for the simulation',
        items: {
          type: 'object',
          properties: {
            categoryUuid: {
              type: 'string',
            },
            targetAmount: {
              type: 'number',
              description: 'Target amount in dollars',
            },
            startDate: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD) - optional',
            },
            endDate: {
              type: 'string',
              description: 'End date (YYYY-MM-DD) - optional',
            },
          },
          required: ['categoryUuid', 'targetAmount'],
        },
      },
      isActive: {
        type: 'boolean',
        description: 'Whether the simulation is active (default: true)',
      },
    },
    required: ['budgetUuid', 'name', 'categoryChanges'],
  },
};

// Server implementation
class BudgetMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'budget-ai-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        GET_BUDGETS_TOOL,
        GET_TRANSACTIONS_TOOL,
        GET_BUDGET_SUMMARY_TOOL,
        GET_CATEGORIES_TOOL,
        GET_ACCOUNTS_TOOL,
        GET_UNCATEGORIZED_TOOL,
        GET_SIMULATIONS_TOOL,
        CATEGORIZE_TRANSACTION_TOOL,
        CREATE_SIMULATION_TOOL,
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params;

        try {
          await connectDB();

          switch (name) {
            case 'get_budgets':
              return await this.handleGetBudgets(args);
            case 'get_transactions':
              return await this.handleGetTransactions(args);
            case 'get_budget_summary':
              return await this.handleGetBudgetSummary(args);
            case 'get_categories':
              return await this.handleGetCategories(args);
            case 'get_accounts':
              return await this.handleGetAccounts(args);
            case 'get_uncategorized_transactions':
              return await this.handleGetUncategorized(args);
            case 'get_simulations':
              return await this.handleGetSimulations(args);
            case 'categorize_transaction':
              return await this.handleCategorizeTransaction(args);
            case 'create_simulation':
              return await this.handleCreateSimulation(args);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`,
              },
            ],
          };
        }
      }
    );
  }

  private async handleGetBudgets(args: any) {
    const budgets = await LocalBudget.find({});

    const budgetList = budgets
      .map((b) => `- ${b.name} (UUID: ${b.uuid})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available Budgets:\n\n${budgetList || 'No budgets found'}`,
        },
      ],
    };
  }

  private async handleGetTransactions(args: any) {
    const { budgetUuid, startDate, endDate, categoryName, payeeName, minAmount, maxAmount, limit = 50 } = args;

    // Find budget
    const budget = await LocalBudget.findOne({ uuid: budgetUuid });
    if (!budget) {
      throw new Error(`Budget not found: ${budgetUuid}`);
    }

    // Build query
    const query: any = { budgetId: budget._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (payeeName) {
      query.payeeName = { $regex: payeeName, $options: 'i' };
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined) query.amount.$gte = minAmount * 1000; // Convert to milliunits
      if (maxAmount !== undefined) query.amount.$lte = maxAmount * 1000;
    }

    // Get transactions
    let transactions = await LocalTransaction.find(query)
      .populate('categoryId')
      .sort({ date: -1 })
      .limit(limit);

    // Filter by category name if provided
    if (categoryName) {
      transactions = transactions.filter(
        (tx) =>
          tx.categoryId &&
          (tx.categoryId as any).name?.toLowerCase().includes(categoryName.toLowerCase())
      );
    }

    if (transactions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No transactions found matching the criteria.',
          },
        ],
      };
    }

    const formattedTransactions = transactions
      .map((tx) => formatTransaction(tx))
      .join('\n\n');

    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${transactions.length} transaction(s):\n\n${formattedTransactions}\n\n---\nTotal: ${formatAmount(totalAmount)}`,
        },
      ],
    };
  }

  private async handleGetBudgetSummary(args: any) {
    const { budgetUuid, month } = args;

    const budget = await LocalBudget.findOne({ uuid: budgetUuid });
    if (!budget) {
      throw new Error(`Budget not found: ${budgetUuid}`);
    }

    const categories = await LocalCategory.find({ budgetId: budget._id });

    if (categories.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No categories found for this budget.',
          },
        ],
      };
    }

    const formattedCategories = categories
      .map((cat) => formatCategory(cat))
      .join('\n\n');

    const totalBudgeted = categories.reduce((sum, cat) => sum + (cat.budgeted || 0), 0);
    const totalActivity = categories.reduce((sum, cat) => sum + (cat.activity || 0), 0);
    const totalBalance = categories.reduce((sum, cat) => sum + (cat.balance || 0), 0);

    return {
      content: [
        {
          type: 'text',
          text: `Budget Summary for ${budget.name}${month ? ` (${month})` : ''}:\n\n${formattedCategories}\n\n---\nTotals:\n  Budgeted: ${formatAmount(totalBudgeted)}\n  Activity: ${formatAmount(totalActivity)}\n  Balance: ${formatAmount(totalBalance)}`,
        },
      ],
    };
  }

  private async handleGetCategories(args: any) {
    const { budgetUuid } = args;

    const budget = await LocalBudget.findOne({ uuid: budgetUuid });
    if (!budget) {
      throw new Error(`Budget not found: ${budgetUuid}`);
    }

    const categories = await LocalCategory.find({ budgetId: budget._id });

    if (categories.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No categories found for this budget.',
          },
        ],
      };
    }

    const formattedCategories = categories
      .map((cat) => `- ${cat.name} (UUID: ${cat.uuid})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Categories in ${budget.name}:\n\n${formattedCategories}`,
        },
      ],
    };
  }

  private async handleGetAccounts(args: any) {
    const { budgetUuid } = args;

    const budget = await LocalBudget.findOne({ uuid: budgetUuid });
    if (!budget) {
      throw new Error(`Budget not found: ${budgetUuid}`);
    }

    const accounts = await LocalAccount.find({ budgetId: budget._id });

    if (accounts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No accounts found for this budget.',
          },
        ],
      };
    }

    const formattedAccounts = accounts
      .map((acct) => formatAccount(acct))
      .join('\n\n');

    const totalBalance = accounts.reduce((sum, acct) => sum + (acct.balance || 0), 0);

    return {
      content: [
        {
          type: 'text',
          text: `Accounts in ${budget.name}:\n\n${formattedAccounts}\n\n---\nTotal Balance: ${formatAmount(totalBalance)}`,
        },
      ],
    };
  }

  private async handleGetUncategorized(args: any) {
    const { budgetUuid, limit = 50 } = args;

    const budget = await LocalBudget.findOne({ uuid: budgetUuid });
    if (!budget) {
      throw new Error(`Budget not found: ${budgetUuid}`);
    }

    const transactions = await LocalTransaction.find({
      budgetId: budget._id,
      categoryId: null,
    })
      .sort({ date: -1 })
      .limit(limit);

    if (transactions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No uncategorized transactions found!',
          },
        ],
      };
    }

    const formattedTransactions = transactions
      .map((tx) => formatTransaction(tx))
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${transactions.length} uncategorized transaction(s):\n\n${formattedTransactions}`,
        },
      ],
    };
  }

  private async handleGetSimulations(args: any) {
    const { budgetUuid, activeOnly = false } = args;

    const budget = await LocalBudget.findOne({ uuid: budgetUuid });
    if (!budget) {
      throw new Error(`Budget not found: ${budgetUuid}`);
    }

    const query: any = { budgetId: budget._id };
    if (activeOnly) {
      query.isActive = true;
    }

    const simulations = await Simulation.find(query);

    if (simulations.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No simulations found for this budget.',
          },
        ],
      };
    }

    const formattedSimulations = simulations
      .map((sim) => {
        const changes = sim.categoryChanges
          .map(
            (c: any) =>
              `    - Category ${c.categoryUuid}: ${formatAmount(c.targetAmount || 0)}${
                c.startDate ? ` (${c.startDate} to ${c.endDate})` : ''
              }`
          )
          .join('\n');

        return `${sim.name} (${sim.isActive ? 'Active' : 'Inactive'}):\n${changes}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Simulations for ${budget.name}:\n\n${formattedSimulations}`,
        },
      ],
    };
  }

  private async handleCategorizeTransaction(args: any) {
    const { transactionUuid, categoryUuid } = args;

    const transaction = await LocalTransaction.findOne({ uuid: transactionUuid });
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionUuid}`);
    }

    const category = await LocalCategory.findOne({ uuid: categoryUuid });
    if (!category) {
      throw new Error(`Category not found: ${categoryUuid}`);
    }

    transaction.categoryId = category._id;
    await transaction.save();

    return {
      content: [
        {
          type: 'text',
          text: `Successfully categorized transaction "${transaction.payeeName}" as "${category.name}"`,
        },
      ],
    };
  }

  private async handleCreateSimulation(args: any) {
    const { budgetUuid, name, categoryChanges, isActive = true } = args;

    const budget = await LocalBudget.findOne({ uuid: budgetUuid });
    if (!budget) {
      throw new Error(`Budget not found: ${budgetUuid}`);
    }

    // Convert dollar amounts to milliunits
    const processedChanges = categoryChanges.map((change: any) => ({
      ...change,
      targetAmount: change.targetAmount * 1000, // Convert to milliunits
    }));

    const simulation = new Simulation({
      budgetId: budget._id,
      name,
      categoryChanges: processedChanges,
      isActive,
    });

    await simulation.save();

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created simulation "${name}" for budget ${budget.name}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Budget AI MCP Server running on stdio');
  }
}

// Start the server
const server = new BudgetMCPServer();
server.run().catch(console.error);
