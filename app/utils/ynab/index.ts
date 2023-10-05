export const formatYnabAmount = (amount: number) => {
  return (amount / 1000).toFixed(2) + "€";
};
