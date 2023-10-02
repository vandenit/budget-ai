import BudgetPage from "@/app/components/budget-page";

async function BudgetRoute({ params }: { params: { budgetId: string } }) {
  const { budgetId } = params;

  return <BudgetPage budgetId={budgetId} />;
}

export default BudgetRoute;
