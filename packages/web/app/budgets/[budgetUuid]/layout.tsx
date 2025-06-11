interface BudgetLayoutProps {
  children: React.ReactNode;
  params: {
    budgetUuid: string;
  };
}

export default function BudgetLayout({ children, params }: BudgetLayoutProps) {
  return children;
}
