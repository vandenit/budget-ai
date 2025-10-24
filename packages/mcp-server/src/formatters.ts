/**
 * Format amount from milliunits to dollars
 */
export function formatAmount(milliunits: number): string {
  const dollars = milliunits / 1000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Format date to readable string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format transaction for display
 */
export function formatTransaction(tx: any): string {
  const amount = formatAmount(tx.amount);
  const date = formatDate(tx.date);
  const payee = tx.payeeName || 'Unknown';
  const category = tx.categoryId?.name || 'Uncategorized';
  const account = tx.accountName || 'Unknown';

  let result = `${date} | ${payee} | ${amount} | ${category} | ${account}`;

  if (tx.memo) {
    result += `\n  Memo: ${tx.memo}`;
  }

  return result;
}

/**
 * Format category summary
 */
export function formatCategory(cat: any): string {
  const budgeted = formatAmount(cat.budgeted || 0);
  const activity = formatAmount(cat.activity || 0);
  const balance = formatAmount(cat.balance || 0);

  return `${cat.name}:\n  Budgeted: ${budgeted}\n  Activity: ${activity}\n  Balance: ${balance}`;
}

/**
 * Format account summary
 */
export function formatAccount(acct: any): string {
  const balance = formatAmount(acct.balance || 0);
  const cleared = formatAmount(acct.cleared_balance || 0);
  const uncleared = formatAmount(acct.uncleared_balance || 0);

  return `${acct.name}:\n  Balance: ${balance}\n  Cleared: ${cleared}\n  Uncleared: ${uncleared}`;
}
