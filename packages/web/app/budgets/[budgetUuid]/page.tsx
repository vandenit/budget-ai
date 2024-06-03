import BudgetPage from "../../components/budget-page";

async function BudgetRoute({ params }: { params: { budgetUuid: string } }) {
  const { budgetUuid } = params;

  return <BudgetPage budgetUuid={budgetUuid} />;
}

export default BudgetRoute;
