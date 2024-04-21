import TransactionsPage from "@/app/components/transactions-page";

async function TransactionsRoute({
  params,
  searchParams,
}: {
  params: { budgetUuid: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const { budgetUuid } = params;
  const { categoryUuid, month, dayOfMonth } = searchParams;
  return (
    <TransactionsPage
      budgetUuid={budgetUuid}
      categoryUuid={categoryUuid}
      month={month}
      dayOfMonth={dayOfMonth}
    />
  );
}

export default TransactionsRoute;
