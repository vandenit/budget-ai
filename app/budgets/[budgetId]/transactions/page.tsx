import TransactionsPage from "@/app/components/transactions-page";

async function TransactionsRoute({
  params,
  searchParams,
}: {
  params: { budgetId: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const { budgetId } = params;
  const { categoryId, month, dayOfMonth } = searchParams;
  return (
    <TransactionsPage
      budgetId={budgetId}
      categoryId={categoryId}
      month={month}
      dayOfMonth={dayOfMonth}
    />
  );
}

export default TransactionsRoute;
