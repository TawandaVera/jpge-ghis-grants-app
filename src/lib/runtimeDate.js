const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const toIsoDate = (date = new Date()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Invalid date supplied to toIsoDate');
  }

  return date.toISOString().split('T')[0];
};

export const getEvaluationDate = () => {
  const override = import.meta.env?.VITE_EVALUATION_DATE;

  if (override) {
    if (!ISO_DATE_PATTERN.test(override)) {
      throw new Error('VITE_EVALUATION_DATE must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${override}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('VITE_EVALUATION_DATE is not a valid calendar date');
    }

    return parsed;
  }

  return new Date();
};

export const getEvaluationDateLabel = () => toIsoDate(getEvaluationDate());

export const daysUntilDate = (targetDate, fromDate = getEvaluationDate()) => {
  if (!targetDate) return null;

  const parsedTarget = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (Number.isNaN(parsedTarget.getTime())) return null;

  const parsedFrom = fromDate instanceof Date ? fromDate : new Date(fromDate);
  if (Number.isNaN(parsedFrom.getTime())) return null;

  return Math.round((parsedTarget - parsedFrom) / 86_400_000);
};
