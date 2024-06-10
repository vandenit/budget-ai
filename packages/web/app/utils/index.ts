export const percentageToStatusClass = (percentage: number) => {
  let statusClass = "info";
  if (percentage > 85) {
    statusClass = "error";
  } else if (percentage > 50) {
    statusClass = "warning";
  }
  return statusClass;
};
