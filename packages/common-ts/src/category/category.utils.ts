import { Transaction } from "../transaction/transaction.utils";

export type CategoryTarget = {
  /**
   * The type of goal, if the category has a goal (TB='Target Category Balance', TBD='Target Category Balance by Date', MF='Monthly Funding', NEED='Plan Your Spending')
   */
  goal_type?: "TB" | "TBD" | "MF" | "NEED" | "DEBT" | null;

  /**
   * A day offset modifier for the goal's due date.
   * When goal_cadence is 2 (Weekly), this value specifies which day of the week the goal is due (0 = Sunday, 6 = Saturday).
   * Otherwise, this value specifies which day of the month the goal is due (1 = 1st, 31 = 31st, null = Last day of Month).
   */
  goal_day?: number | null;

  /**
   * The goal cadence. Value in range 0-14.
   */
  goal_cadence?: number | null;

  /**
   * The goal cadence frequency.
   */
  goal_cadence_frequency?: number | null;

  /**
   * The month a goal was created, formatted as 'YYYY-MM'.
   */
  goal_creation_month?: string | null;

  /**
   * The goal target amount in milliunits.
   */
  goal_target?: number | null;

  /**
   * The original target month for the goal to be completed.
   */
  goal_target_month?: string | null;

  /**
   * The percentage completion of the goal.
   */
  goal_percentage_complete?: number | null;

  /**
   * The number of months, including the current month, left in the current goal period.
   */
  goal_months_to_budget?: number | null;

  /**
   * The amount of funding still needed in the current month to stay on track towards completing the goal within the current goal period.
   */
  goal_under_funded?: number | null;

  /**
   * The total amount funded towards the goal within the current goal period.
   */
  goal_overall_funded?: number | null;

  /**
   * The amount of funding still needed to complete the goal within the current goal period.
   */
  goal_overall_left?: number | null;
};

export type Category = {
  _id?: string;
  name: string;
  uuid: string;
  balance: number;
  budgeted: number;
  activity: number;
  targetAmount: number;
  budgetId: string;
  typicalSpendingPattern: number;
  historicalAverage: number;
  target?: CategoryTarget | null;
};

export const emptyCategory: Category = {
  _id: "",
  name: "",
  uuid: "",
  balance: 0,
  budgeted: 0,
  activity: 0,
  targetAmount: 0,
  budgetId: "",
  typicalSpendingPattern: 0,
  historicalAverage: 0,
};

export type CategoryUsage = {
  name: string;
  uuid: string | undefined | null;
  amount: number;
};

export const isInflowCategory = (category: Category) => {
  return category.name.startsWith("Inflow");
};

export const categorySorter = (a: Category, b: Category): number =>
  a.name.localeCompare(b.name);

export const withoutInflowCategoryFilter = (category: Category) =>
  !isInflowCategory(category);
