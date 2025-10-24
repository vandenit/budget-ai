import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatDate,
  formatTransaction,
  formatCategory,
  formatAccount,
} from './formatters';

describe('formatAmount', () => {
  it('should format positive milliunits to dollars', () => {
    // Arrange
    const milliunits = 12345; // $12.345

    // Act
    const result = formatAmount(milliunits);

    // Assert
    expect(result).toBe('$12.35');
  });

  it('should format negative milliunits to dollars', () => {
    // Arrange
    const milliunits = -12345; // -$12.345

    // Act
    const result = formatAmount(milliunits);

    // Assert
    expect(result).toBe('-$12.35');
  });

  it('should format zero correctly', () => {
    // Arrange
    const milliunits = 0;

    // Act
    const result = formatAmount(milliunits);

    // Assert
    expect(result).toBe('$0.00');
  });

  it('should format large amounts correctly', () => {
    // Arrange
    const milliunits = 1234567890; // $1,234,567.89

    // Act
    const result = formatAmount(milliunits);

    // Assert
    expect(result).toBe('$1,234,567.89');
  });

  it('should round to 2 decimal places', () => {
    // Arrange
    const milliunits = 12346; // $12.346 should round to $12.35

    // Act
    const result = formatAmount(milliunits);

    // Assert
    expect(result).toBe('$12.35');
  });
});

describe('formatDate', () => {
  it('should format date string to readable format', () => {
    // Arrange
    const dateStr = '2024-10-24';

    // Act
    const result = formatDate(dateStr);

    // Assert
    expect(result).toBe('October 24, 2024');
  });

  it('should format different month correctly', () => {
    // Arrange
    const dateStr = '2024-01-15';

    // Act
    const result = formatDate(dateStr);

    // Assert
    expect(result).toBe('January 15, 2024');
  });

  it('should handle end of year date', () => {
    // Arrange
    const dateStr = '2024-12-31';

    // Act
    const result = formatDate(dateStr);

    // Assert
    expect(result).toBe('December 31, 2024');
  });
});

describe('formatTransaction', () => {
  it('should format complete transaction', () => {
    // Arrange
    const transaction = {
      date: '2024-10-24',
      payeeName: 'Starbucks',
      amount: 5000, // $5.00
      categoryId: { name: 'Coffee' },
      accountName: 'Checking',
      memo: 'Morning coffee',
    };

    // Act
    const result = formatTransaction(transaction);

    // Assert
    expect(result).toContain('October 24, 2024');
    expect(result).toContain('Starbucks');
    expect(result).toContain('$5.00');
    expect(result).toContain('Coffee');
    expect(result).toContain('Checking');
    expect(result).toContain('Memo: Morning coffee');
  });

  it('should handle transaction without memo', () => {
    // Arrange
    const transaction = {
      date: '2024-10-24',
      payeeName: 'Target',
      amount: 10000,
      categoryId: { name: 'Groceries' },
      accountName: 'Checking',
    };

    // Act
    const result = formatTransaction(transaction);

    // Assert
    expect(result).toContain('Target');
    expect(result).not.toContain('Memo:');
  });

  it('should handle uncategorized transaction', () => {
    // Arrange
    const transaction = {
      date: '2024-10-24',
      payeeName: 'Unknown Store',
      amount: 2500,
      categoryId: null,
      accountName: 'Checking',
    };

    // Act
    const result = formatTransaction(transaction);

    // Assert
    expect(result).toContain('Uncategorized');
  });

  it('should handle missing payee name', () => {
    // Arrange
    const transaction = {
      date: '2024-10-24',
      payeeName: null,
      amount: 1000,
      categoryId: { name: 'Food' },
      accountName: 'Checking',
    };

    // Act
    const result = formatTransaction(transaction);

    // Assert
    expect(result).toContain('Unknown');
  });

  it('should format negative amounts correctly', () => {
    // Arrange
    const transaction = {
      date: '2024-10-24',
      payeeName: 'Paycheck',
      amount: -500000, // -$500.00 (income)
      categoryId: { name: 'Income' },
      accountName: 'Checking',
    };

    // Act
    const result = formatTransaction(transaction);

    // Assert
    expect(result).toContain('-$500.00');
  });
});

describe('formatCategory', () => {
  it('should format category with all fields', () => {
    // Arrange
    const category = {
      name: 'Groceries',
      budgeted: 50000, // $50.00
      activity: -30000, // -$30.00
      balance: 20000, // $20.00
    };

    // Act
    const result = formatCategory(category);

    // Assert
    expect(result).toContain('Groceries');
    expect(result).toContain('Budgeted: $50.00');
    expect(result).toContain('Activity: -$30.00');
    expect(result).toContain('Balance: $20.00');
  });

  it('should handle zero values', () => {
    // Arrange
    const category = {
      name: 'New Category',
      budgeted: 0,
      activity: 0,
      balance: 0,
    };

    // Act
    const result = formatCategory(category);

    // Assert
    expect(result).toContain('Budgeted: $0.00');
    expect(result).toContain('Activity: $0.00');
    expect(result).toContain('Balance: $0.00');
  });

  it('should handle missing values', () => {
    // Arrange
    const category = {
      name: 'Test Category',
    };

    // Act
    const result = formatCategory(category);

    // Assert
    expect(result).toContain('Test Category');
    expect(result).toContain('$0.00');
  });
});

describe('formatAccount', () => {
  it('should format account with all balances', () => {
    // Arrange
    const account = {
      name: 'Checking Account',
      balance: 100000, // $100.00
      cleared_balance: 95000, // $95.00
      uncleared_balance: 5000, // $5.00
    };

    // Act
    const result = formatAccount(account);

    // Assert
    expect(result).toContain('Checking Account');
    expect(result).toContain('Balance: $100.00');
    expect(result).toContain('Cleared: $95.00');
    expect(result).toContain('Uncleared: $5.00');
  });

  it('should handle zero balances', () => {
    // Arrange
    const account = {
      name: 'New Account',
      balance: 0,
      cleared_balance: 0,
      uncleared_balance: 0,
    };

    // Act
    const result = formatAccount(account);

    // Assert
    expect(result).toContain('Balance: $0.00');
    expect(result).toContain('Cleared: $0.00');
    expect(result).toContain('Uncleared: $0.00');
  });

  it('should handle negative balances', () => {
    // Arrange
    const account = {
      name: 'Credit Card',
      balance: -50000, // -$50.00
      cleared_balance: -45000, // -$45.00
      uncleared_balance: -5000, // -$5.00
    };

    // Act
    const result = formatAccount(account);

    // Assert
    expect(result).toContain('Balance: -$50.00');
    expect(result).toContain('Cleared: -$45.00');
    expect(result).toContain('Uncleared: -$5.00');
  });

  it('should handle missing balance values', () => {
    // Arrange
    const account = {
      name: 'Savings Account',
    };

    // Act
    const result = formatAccount(account);

    // Assert
    expect(result).toContain('Savings Account');
    expect(result).toContain('$0.00');
  });
});
