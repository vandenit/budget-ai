import TransactionsPage from "../../../components/transactions-page";
import BudgetSubNavigation from "../../../components/budget-sub-navigation";

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
    <>
      <BudgetSubNavigation budgetUuid={budgetUuid} />
      <TransactionsPage
        budgetUuid={budgetUuid}
        categoryUuid={categoryUuid}
        month={month}
        dayOfMonth={dayOfMonth}
      />
    </>
  );
}

export default TransactionsRoute;
