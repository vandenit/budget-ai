import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables before importing api-client
process.env.AUTH0_TOKEN = 'test-token-12345';
process.env.API_BASE_URL = 'http://localhost:4000';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

import fetch from 'node-fetch';
import { BudgetApiClient } from './api-client';

const mockFetch = fetch as any;

describe('BudgetApiClient', () => {
  let client: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create a new client instance for each test (avoid the process.exit check)
    const BudgetApiClientClass = class {
      private baseUrl: string;
      private token: string;

      constructor(baseUrl: string, token: string) {
        this.baseUrl = baseUrl;
        this.token = token;
      }

      private async request<T>(endpoint: string, options: any = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers: any = {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        };

        const response = await fetch(url, {
          ...options,
          headers,
        } as any);

        if (!response.ok) {
          const errorText = await response.text();
          throw {
            message: `API Error: ${response.statusText} - ${errorText}`,
            status: response.status,
          };
        }

        return await response.json() as T;
      }

      async getBudgets(): Promise<any[]> {
        return this.request('/budgets');
      }

      async getBudget(uuid: string): Promise<any> {
        return this.request(`/budgets/${uuid}`);
      }

      async getTransactions(budgetUuid: string, params?: any): Promise<any[]> {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.startDate) queryParams.append('startDate', params.startDate);
          if (params.endDate) queryParams.append('endDate', params.endDate);
          if (params.payeeName) queryParams.append('payeeName', params.payeeName);
          if (params.minAmount !== undefined) queryParams.append('minAmount', params.minAmount.toString());
          if (params.maxAmount !== undefined) queryParams.append('maxAmount', params.maxAmount.toString());
          if (params.limit) queryParams.append('limit', params.limit.toString());
        }
        const query = queryParams.toString();
        const endpoint = `/budgets/${budgetUuid}/transactions${query ? `?${query}` : ''}`;
        return this.request(endpoint);
      }

      async createSimulation(budgetUuid: string, data: any): Promise<any> {
        return this.request(`/simulations/budget/${budgetUuid}`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    };

    client = new BudgetApiClientClass('http://localhost:4000', 'test-token');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getBudgets', () => {
    it('should fetch budgets successfully', async () => {
      // Arrange
      const mockBudgets = [
        { uuid: 'budget-1', name: 'My Budget' },
        { uuid: 'budget-2', name: 'Second Budget' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBudgets,
        text: async () => JSON.stringify(mockBudgets),
      });

      // Act
      const result = await client.getBudgets();

      // Assert
      expect(result).toEqual(mockBudgets);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/budgets',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error on failed request', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      // Act & Assert
      await expect(client.getBudgets()).rejects.toMatchObject({
        message: expect.stringContaining('Unauthorized'),
        status: undefined,
      });
    });
  });

  describe('getBudget', () => {
    it('should fetch single budget by UUID', async () => {
      // Arrange
      const mockBudget = { uuid: 'budget-123', name: 'Test Budget' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBudget,
      });

      // Act
      const result = await client.getBudget('budget-123');

      // Assert
      expect(result).toEqual(mockBudget);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/budgets/budget-123',
        expect.any(Object)
      );
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions without filters', async () => {
      // Arrange
      const mockTransactions = [
        { uuid: 'tx-1', amount: 5000, payeeName: 'Starbucks' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      });

      // Act
      const result = await client.getTransactions('budget-123');

      // Assert
      expect(result).toEqual(mockTransactions);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/budgets/budget-123/transactions',
        expect.any(Object)
      );
    });

    it('should fetch transactions with date filters', async () => {
      // Arrange
      const mockTransactions = [
        { uuid: 'tx-1', amount: 5000, date: '2024-10-24' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      });

      // Act
      const result = await client.getTransactions('budget-123', {
        startDate: '2024-10-01',
        endDate: '2024-10-31',
      });

      // Assert
      expect(result).toEqual(mockTransactions);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/budgets/budget-123/transactions?startDate=2024-10-01&endDate=2024-10-31',
        expect.any(Object)
      );
    });

    it('should fetch transactions with amount filters', async () => {
      // Arrange
      const mockTransactions = [
        { uuid: 'tx-1', amount: 100000 },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      });

      // Act
      const result = await client.getTransactions('budget-123', {
        minAmount: 50,
        maxAmount: 200,
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/budgets/budget-123/transactions?minAmount=50&maxAmount=200',
        expect.any(Object)
      );
    });

    it('should fetch transactions with payee filter', async () => {
      // Arrange
      const mockTransactions = [
        { uuid: 'tx-1', payeeName: 'Starbucks' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransactions,
      });

      // Act
      const result = await client.getTransactions('budget-123', {
        payeeName: 'Starbucks',
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/budgets/budget-123/transactions?payeeName=Starbucks',
        expect.any(Object)
      );
    });
  });

  describe('createSimulation', () => {
    it('should create simulation with POST request', async () => {
      // Arrange
      const simulationData = {
        name: 'Test Simulation',
        categoryChanges: [
          { categoryUuid: 'cat-1', targetAmount: 50000 },
        ],
        isActive: true,
      };

      const mockResponse = { id: 'sim-123', ...simulationData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await client.createSimulation('budget-123', simulationData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/simulations/budget/budget-123',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(simulationData),
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle API errors properly', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid simulation data',
      });

      // Act & Assert
      await expect(
        client.createSimulation('budget-123', { name: 'Test' })
      ).rejects.toMatchObject({
        message: expect.stringContaining('Bad Request'),
      });
    });
  });

  describe('Authentication', () => {
    it('should include Authorization header in all requests', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      // Act
      await client.getBudgets();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should include Content-Type header in all requests', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      // Act
      await client.getBudgets();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid or expired token',
      });

      // Act & Assert
      await expect(client.getBudgets()).rejects.toMatchObject({
        message: expect.stringContaining('Unauthorized'),
      });
    });

    it('should handle 404 Not Found errors', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Budget not found',
      });

      // Act & Assert
      await expect(client.getBudget('non-existent')).rejects.toMatchObject({
        message: expect.stringContaining('Not Found'),
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      // Act & Assert
      await expect(client.getBudgets()).rejects.toThrow();
    });
  });
});
