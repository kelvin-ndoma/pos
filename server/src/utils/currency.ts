export const formatCurrency = (
  amount: number,
  currency: string = 'KES',
  locale: string = 'en-KE'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const calculateTax = (
  amount: number,
  taxRate: number,
  isInclusive: boolean
): { tax: number; subtotal: number; total: number } => {
  if (isInclusive) {
    const tax = (amount * taxRate) / (100 + taxRate);
    return {
      tax,
      subtotal: amount - tax,
      total: amount,
    };
  } else {
    const tax = (amount * taxRate) / 100;
    return {
      tax,
      subtotal: amount,
      total: amount + tax,
    };
  }
};

export const calculateDiscount = (
  amount: number,
  discount: number,
  type: 'PERCENTAGE' | 'FIXED'
): number => {
  if (type === 'PERCENTAGE') {
    return (amount * discount) / 100;
  }
  return Math.min(discount, amount);
};