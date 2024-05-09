export type Transaction = {
  uuid: string;
  accountName: string;
  amount: number;
  date: string;
  categoryName: string;
  categoryId: string | undefined | null;
  payeeName: string;
  memo: string;
};

export interface GroupedTransactions {
  [key: string]: Transaction[];
}
