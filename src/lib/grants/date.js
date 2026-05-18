export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(days) {
  const safeDays = Number.isFinite(Number(days)) ? Number(days) : 90;
  return new Date(Date.now() + safeDays * 86400000).toISOString().slice(0, 10);
}

export function daysUntil(dateValue) {
  if (!dateValue) return null;

  const deadline = new Date(dateValue);
  if (Number.isNaN(deadline.getTime())) return null;

  const today = new Date();
  return Math.ceil((deadline - today) / 86400000);
}

export function isValidFutureDate(dateValue) {
  const days = daysUntil(dateValue);
  return days !== null && days >= 0;
}
