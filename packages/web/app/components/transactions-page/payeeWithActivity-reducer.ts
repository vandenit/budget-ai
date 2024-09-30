import { PayeeWithActivity, Transaction } from "common-ts";

export const payeeWithActivityReducer = (
  payeesWithActivity: Array<PayeeWithActivity>,
  transaction: Transaction
) => {
  // only include costs (activity < 0)
  if (transaction.amount >= 0) {
    return payeesWithActivity;
  }
  const payeeName = transaction.cleanPayeeName;
  const payeeWithActivity = payeesWithActivity.find(
    (payeeWithActivity: PayeeWithActivity) =>
      payeeWithActivity.payeeName === payeeName
  );
  if (payeeWithActivity) {
    payeeWithActivity.activity += transaction.amount;
  } else {
    payeesWithActivity.push({
      payeeName,
      activity: transaction.amount,
    });
  }
  return payeesWithActivity;
};
