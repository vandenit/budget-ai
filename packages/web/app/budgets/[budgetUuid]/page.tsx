import BudgetPage from "../../components/budget-page";
import BudgetSubNavigation from "../../components/budget-sub-navigation";

async function BudgetRoute({ params }: { params: { budgetUuid: string } }) {
  const { budgetUuid } = params;

  return (
    <>
      <BudgetSubNavigation budgetUuid={budgetUuid} />
      <BudgetPage budgetUuid={budgetUuid} />
    </>
  );
}

export default BudgetRoute;
