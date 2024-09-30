export const extractPayeeName = (
  payeeName: string | undefined | null
): string => {
  if (!payeeName) {
    return "";
  }
  // Regex to remove leading digits and extract name before "Betaling met" or digits
  const match = payeeName.match(/^\d*\s*(.*?)(?=\s*Betaling met|\d|$)/i);

  // Return the extracted name or the entire cleaned string if no special cases found
  return match ? match[1].trim() : payeeName.trim();
};
