import TransactionsPage from "@/app/components/transactions-page";

async function TransactionsRoute({
  params,
  searchParams,
}: {
  params: { budgetId: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const { budgetId } = params;
  const { categoryId, month } = searchParams;
  return (
    <TransactionsPage
      budgetId={budgetId}
      categoryId={categoryId}
      month={month}
    />
  );
}

export default TransactionsRoute;
