import { Category } from "../category";

export type Transaction = {
  uuid: string;
  accountName: string;
  amount: number;
  date: string;
  categoryId: string | undefined | null;
  payeeName: string;
  cleanPayeeName: string;
  memo: string;
};

export interface GroupedTransactions {
  [key: string]: Transaction[];
}

export type TransactionsWithCategories = {
  transactions: Transaction[];
  categories: Category[];
};

export type PayeeWithActivity = {
  payeeName: string;
  activity: number;
};
