import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const AUTH_TOKEN = process.env.AUTH0_TOKEN;

if (!AUTH_TOKEN) {
  console.error('❌ AUTH0_TOKEN environment variable is required');
  console.error('Please set AUTH0_TOKEN in your MCP server configuration');
  process.exit(1);
}

interface ApiError {
  message: string;
  status: number;
}

class BudgetApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = API_BASE_URL, token: string = AUTH_TOKEN!) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: any = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: any = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      } as any);

      if (!response.ok) {
        const errorText = await response.text();
        throw {
          message: `API Error: ${response.statusText} - ${errorText}`,
          status: response.status,
        } as ApiError;
      }

      return await response.json() as T;
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        message: `Network Error: ${error.message}`,
        status: 0,
      } as ApiError;
    }
  }

  // Budget endpoints
  async getBudgets(): Promise<any[]> {
    return this.request('/budgets');
  }

  async getBudget(uuid: string): Promise<any> {
    return this.request(`/budgets/${uuid}`);
  }

  async getBudgetOverview(uuid: string): Promise<any> {
    return this.request(`/budgets/${uuid}/overview`);
  }

  async getAccounts(budgetUuid: string): Promise<any[]> {
    return this.request(`/budgets/${budgetUuid}/accounts`);
  }

  // Transaction endpoints
  async getTransactions(budgetUuid: string, params?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    payeeName?: string;
    minAmount?: number;
    maxAmount?: number;
    limit?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.payeeName) queryParams.append('payeeName', params.payeeName);
      if (params.minAmount !== undefined) queryParams.append('minAmount', params.minAmount.toString());
      if (params.maxAmount !== undefined) queryParams.append('maxAmount', params.maxAmount.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
    }

    const query = queryParams.toString();
    const endpoint = `/budgets/${budgetUuid}/transactions${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  async getUncategorizedTransactions(budgetUuid: string, limit?: number): Promise<any[]> {
    const endpoint = `/budgets/${budgetUuid}/uncategorized-transactions${limit ? `?limit=${limit}` : ''}`;
    return this.request(endpoint);
  }

  async getUnapprovedTransactions(budgetUuid: string): Promise<any[]> {
    return this.request(`/budgets/${budgetUuid}/unapproved-transactions`);
  }

  // AI Suggestions endpoints
  async getCachedSuggestions(budgetUuid: string): Promise<any[]> {
    return this.request(`/budgets/${budgetUuid}/ai-suggestions/cached`);
  }

  async suggestCategories(budgetUuid: string): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/ai-suggestions/suggest-categories`);
  }

  async applySingleCategory(budgetUuid: string, transactionUuid: string, categoryUuid: string): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/ai-suggestions/apply-single`, {
      method: 'POST',
      body: JSON.stringify({ transactionUuid, categoryUuid }),
    });
  }

  async applyCategories(budgetUuid: string, categorizations: Array<{transactionUuid: string, categoryUuid: string}>): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/ai-suggestions/apply-categories`, {
      method: 'POST',
      body: JSON.stringify({ categorizations }),
    });
  }

  async approveTransaction(budgetUuid: string, transactionUuid: string): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/transactions/approve-single`, {
      method: 'POST',
      body: JSON.stringify({ transactionUuid }),
    });
  }

  async approveAllTransactions(budgetUuid: string): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/transactions/approve-all`, {
      method: 'POST',
    });
  }

  // Simulation endpoints
  async getSimulations(budgetUuid: string, activeOnly: boolean = false): Promise<any[]> {
    const endpoint = `/simulations/budget/${budgetUuid}${activeOnly ? '?activeOnly=true' : ''}`;
    return this.request(endpoint);
  }

  async createSimulation(budgetUuid: string, data: {
    name: string;
    categoryChanges: Array<{
      categoryUuid: string;
      targetAmount: number;
      startDate?: string;
      endDate?: string;
    }>;
    isActive?: boolean;
  }): Promise<any> {
    return this.request(`/simulations/budget/${budgetUuid}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSimulation(simulationId: string, data: any): Promise<any> {
    return this.request(`/simulations/${simulationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleSimulation(simulationId: string, isActive: boolean): Promise<any> {
    return this.request(`/simulations/${simulationId}/active`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteSimulation(simulationId: string): Promise<any> {
    return this.request(`/simulations/${simulationId}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getLoggedInUser(): Promise<any> {
    return this.request('/users/logged-in');
  }

  // Scheduled transactions
  async getScheduledTransactions(budgetUuid: string): Promise<any[]> {
    return this.request(`/budgets/${budgetUuid}/scheduled-transactions`);
  }

  async createScheduledTransaction(budgetUuid: string, data: any): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/scheduled-transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScheduledTransaction(budgetUuid: string, transactionId: string, data: any): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/scheduled-transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScheduledTransaction(budgetUuid: string, transactionId: string): Promise<any> {
    return this.request(`/budgets/${budgetUuid}/scheduled-transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new BudgetApiClient();
export { BudgetApiClient };
export type { ApiError };
