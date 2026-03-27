export function getPayoutCycle(date: Date = new Date()) {
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.getMonth();

  if (day <= 15) {
    // Cycle 1: 1st to 15th
    return {
      name: 'Cycle 1',
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month, 15, 23, 59, 59, 999),
      payoutDate: new Date(year, month, 15)
    };
  } else {
    // Cycle 2: 16th to end of month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    return {
      name: 'Cycle 2',
      startDate: new Date(year, month, 16),
      endDate: new Date(year, month + 1, 0, 23, 59, 59, 999),
      payoutDate: new Date(year, month + 1, 0)
    };
  }
}

export function getNextPayoutDate(date: Date = new Date()) {
  const cycle = getPayoutCycle(date);
  // If today is exactly the payout date, we might still be in it or looking for the next one.
  // For simplicity, let's say "Next Payout" is the end of the current cycle if we haven't reached it.
  
  if (date > cycle.endDate) {
    // Get next cycle
    const nextDate = new Date(cycle.endDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return getPayoutCycle(nextDate).payoutDate;
  }
  
  return cycle.payoutDate;
}
