#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { apiClient, ApiError } from './api-client.js';
import { formatAmount } from './formatters.js';

dotenv.config();

// Tool definitions
const GET_BUDGETS_TOOL: Tool = {
  name: 'get_budgets',
  description: 'List all budgets accessible to the authenticated user.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

const GET_BUDGET_OVERVIEW_TOOL: Tool = {
  name: 'get_budget_overview',
  description: 'Get comprehensive budget overview including categories, accounts, and summary statistics.',
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

const GET_TRANSACTIONS_TOOL: Tool = {
  name: 'get_transactions',
  description:
    'Get transactions with optional filters. Can filter by date range, category, payee, amount range.',
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

const GET_ACCOUNTS_TOOL: Tool = {
  name: 'get_accounts',
  description: 'Get all accounts in a budget with their balances (cleared and uncleared).',
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
  description: 'Get all transactions that have not been assigned a category.',
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

const GET_UNAPPROVED_TOOL: Tool = {
  name: 'get_unapproved_transactions',
  description: 'Get all transactions that need approval.',
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

const GET_SIMULATIONS_TOOL: Tool = {
  name: 'get_simulations',
  description: 'List all budget simulations (what-if scenarios) for a budget.',
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
  description: 'Assign a category to a transaction. This updates YNAB.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
      transactionUuid: {
        type: 'string',
        description: 'Transaction UUID (required)',
      },
      categoryUuid: {
        type: 'string',
        description: 'Category UUID to assign (required)',
      },
    },
    required: ['budgetUuid', 'transactionUuid', 'categoryUuid'],
  },
};

const APPROVE_TRANSACTION_TOOL: Tool = {
  name: 'approve_transaction',
  description: 'Approve a single transaction in YNAB.',
  inputSchema: {
    type: 'object',
    properties: {
      budgetUuid: {
        type: 'string',
        description: 'Budget UUID (required)',
      },
      transactionUuid: {
        type: 'string',
        description: 'Transaction UUID (required)',
      },
    },
    required: ['budgetUuid', 'transactionUuid'],
  },
};

const CREATE_SIMULATION_TOOL: Tool = {
  name: 'create_simulation',
  description: 'Create a new budget simulation to test what-if scenarios.',
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

const GET_SCHEDULED_TRANSACTIONS_TOOL: Tool = {
  name: 'get_scheduled_transactions',
  description: 'Get all scheduled transactions for a budget from YNAB.',
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

// Server implementation
class BudgetMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'budget-ai-mcp-api',
        version: '2.0.0',
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
        GET_BUDGET_OVERVIEW_TOOL,
        GET_TRANSACTIONS_TOOL,
        GET_ACCOUNTS_TOOL,
        GET_UNCATEGORIZED_TOOL,
        GET_UNAPPROVED_TOOL,
        GET_SIMULATIONS_TOOL,
        GET_SCHEDULED_TRANSACTIONS_TOOL,
        CATEGORIZE_TRANSACTION_TOOL,
        APPROVE_TRANSACTION_TOOL,
        CREATE_SIMULATION_TOOL,
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_budgets':
            return await this.handleGetBudgets(args);
          case 'get_budget_overview':
            return await this.handleGetBudgetOverview(args);
          case 'get_transactions':
            return await this.handleGetTransactions(args);
          case 'get_accounts':
            return await this.handleGetAccounts(args);
          case 'get_uncategorized_transactions':
            return await this.handleGetUncategorized(args);
          case 'get_unapproved_transactions':
            return await this.handleGetUnapproved(args);
          case 'get_simulations':
            return await this.handleGetSimulations(args);
          case 'get_scheduled_transactions':
            return await this.handleGetScheduledTransactions(args);
          case 'categorize_transaction':
            return await this.handleCategorizeTransaction(args);
          case 'approve_transaction':
            return await this.handleApproveTransaction(args);
          case 'create_simulation':
            return await this.handleCreateSimulation(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        const apiError = error as ApiError;
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${apiError.message || error.message}\n${
                apiError.status === 401
                  ? '\n⚠️  Authentication failed. Please check your AUTH0_TOKEN is valid.'
                  : ''
              }`,
            },
          ],
        };
      }
    });
  }

  private async handleGetBudgets(args: any) {
    const budgets = await apiClient.getBudgets();

    if (!budgets || budgets.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No budgets found. Make sure you have connected your YNAB account.',
          },
        ],
      };
    }

    const budgetList = budgets
      .map((b: any) => `- ${b.name} (UUID: ${b.uuid})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Available Budgets:\n\n${budgetList}`,
        },
      ],
    };
  }

  private async handleGetBudgetOverview(args: any) {
    const { budgetUuid } = args;
    const overview = await apiClient.getBudgetOverview(budgetUuid);

    const categoriesText = overview.categories
      ?.map(
        (cat: any) =>
          `  - ${cat.name}: Budgeted ${formatAmount(cat.budgeted || 0)}, Activity ${formatAmount(
            cat.activity || 0
          )}, Balance ${formatAmount(cat.balance || 0)}`
      )
      .join('\n');

    const accountsText = overview.accounts
      ?.map(
        (acc: any) =>
          `  - ${acc.name}: ${formatAmount(acc.balance || 0)} (Cleared: ${formatAmount(
            acc.cleared_balance || 0
          )})`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Budget Overview: ${overview.budget?.name || budgetUuid}\n\n` +
            `Categories:\n${categoriesText || '  No categories'}\n\n` +
            `Accounts:\n${accountsText || '  No accounts'}`,
        },
      ],
    };
  }

  private async handleGetTransactions(args: any) {
    const { budgetUuid, startDate, endDate, payeeName, minAmount, maxAmount, limit } = args;

    const transactions = await apiClient.getTransactions(budgetUuid, {
      startDate,
      endDate,
      payeeName,
      minAmount,
      maxAmount,
      limit: limit || 50,
    });

    if (!transactions || transactions.length === 0) {
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
      .map((tx: any) => {
        const amount = formatAmount(tx.amount);
        const date = tx.date;
        const payee = tx.payeeName || 'Unknown';
        const category = tx.category?.name || 'Uncategorized';
        const account = tx.accountName || 'Unknown';
        let line = `${date} | ${payee} | ${amount} | ${category} | ${account}`;
        if (tx.memo) line += `\n  Memo: ${tx.memo}`;
        return line;
      })
      .join('\n\n');

    const totalAmount = transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${transactions.length} transaction(s):\n\n${formattedTransactions}\n\n---\nTotal: ${formatAmount(totalAmount)}`,
        },
      ],
    };
  }

  private async handleGetAccounts(args: any) {
    const { budgetUuid } = args;
    const accounts = await apiClient.getAccounts(budgetUuid);

    if (!accounts || accounts.length === 0) {
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
      .map(
        (acc: any) =>
          `${acc.name}:\n  Balance: ${formatAmount(acc.balance || 0)}\n  Cleared: ${formatAmount(
            acc.cleared_balance || 0
          )}\n  Uncleared: ${formatAmount(acc.uncleared_balance || 0)}`
      )
      .join('\n\n');

    const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);

    return {
      content: [
        {
          type: 'text',
          text: `Accounts:\n\n${formattedAccounts}\n\n---\nTotal Balance: ${formatAmount(totalBalance)}`,
        },
      ],
    };
  }

  private async handleGetUncategorized(args: any) {
    const { budgetUuid, limit } = args;
    const transactions = await apiClient.getUncategorizedTransactions(budgetUuid, limit);

    if (!transactions || transactions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No uncategorized transactions found! 🎉',
          },
        ],
      };
    }

    const formattedTransactions = transactions
      .map((tx: any) => {
        const amount = formatAmount(tx.amount);
        const date = tx.date;
        const payee = tx.payeeName || 'Unknown';
        const account = tx.accountName || 'Unknown';
        let line = `${date} | ${payee} | ${amount} | ${account}\n  UUID: ${tx.uuid}`;
        if (tx.memo) line += `\n  Memo: ${tx.memo}`;
        return line;
      })
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

  private async handleGetUnapproved(args: any) {
    const { budgetUuid } = args;
    const transactions = await apiClient.getUnapprovedTransactions(budgetUuid);

    if (!transactions || transactions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No unapproved transactions found! 🎉',
          },
        ],
      };
    }

    const formattedTransactions = transactions
      .map((tx: any) => {
        const amount = formatAmount(tx.amount);
        const date = tx.date;
        const payee = tx.payeeName || 'Unknown';
        const category = tx.category?.name || 'Uncategorized';
        let line = `${date} | ${payee} | ${amount} | ${category}\n  UUID: ${tx.uuid}`;
        if (tx.memo) line += `\n  Memo: ${tx.memo}`;
        return line;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${transactions.length} unapproved transaction(s):\n\n${formattedTransactions}`,
        },
      ],
    };
  }

  private async handleGetSimulations(args: any) {
    const { budgetUuid, activeOnly } = args;
    const simulations = await apiClient.getSimulations(budgetUuid, activeOnly);

    if (!simulations || simulations.length === 0) {
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
      .map((sim: any) => {
        const changes = sim.categoryChanges
          ?.map(
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
          text: `Simulations:\n\n${formattedSimulations}`,
        },
      ],
    };
  }

  private async handleGetScheduledTransactions(args: any) {
    const { budgetUuid } = args;
    const scheduled = await apiClient.getScheduledTransactions(budgetUuid);

    if (!scheduled || scheduled.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No scheduled transactions found.',
          },
        ],
      };
    }

    const formattedScheduled = scheduled
      .map((tx: any) => {
        const amount = formatAmount(tx.amount);
        const payee = tx.payee_name || 'Unknown';
        const frequency = tx.frequency || 'Unknown';
        return `${payee} | ${amount} | ${frequency}\n  Next: ${tx.date_next || 'N/A'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Scheduled Transactions:\n\n${formattedScheduled}`,
        },
      ],
    };
  }

  private async handleCategorizeTransaction(args: any) {
    const { budgetUuid, transactionUuid, categoryUuid } = args;
    await apiClient.applySingleCategory(budgetUuid, transactionUuid, categoryUuid);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully categorized transaction in YNAB`,
        },
      ],
    };
  }

  private async handleApproveTransaction(args: any) {
    const { budgetUuid, transactionUuid } = args;
    await apiClient.approveTransaction(budgetUuid, transactionUuid);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully approved transaction in YNAB`,
        },
      ],
    };
  }

  private async handleCreateSimulation(args: any) {
    const { budgetUuid, name, categoryChanges, isActive } = args;

    // Convert dollar amounts to milliunits for API
    const processedChanges = categoryChanges.map((change: any) => ({
      ...change,
      targetAmount: change.targetAmount * 1000,
    }));

    const result = await apiClient.createSimulation(budgetUuid, {
      name,
      categoryChanges: processedChanges,
      isActive: isActive ?? true,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Successfully created simulation "${name}"`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Budget AI MCP Server (API Mode) running on stdio');
  }
}

// Start the server
const server = new BudgetMCPServer();
server.run().catch(console.error);
