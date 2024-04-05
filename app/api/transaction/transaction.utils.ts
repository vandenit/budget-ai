export type Transaction = {
  id: string;
  accountName: string;
  amount: number;
  date: string;
  categoryName: string;
  categoryId: string | undefined | null;
  payeeName: string;
  memo: string;
};
