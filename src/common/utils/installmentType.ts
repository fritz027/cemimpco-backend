const INSTALLMENT_TYPES: Record<number, string> = {
  [-31]: '15th - 30th',
  [-33]: '5th - 20th',
  [-10]: '10th - 25th',
  [-32]: 'end of the month',
  [-15]: 'every 15th of the month',
  [-34]: 'one time',
  [-1]: 'same day of the month',
  [-30]: 'every 30th of the month',
  [-35]: 'lump sum',
  [-36]: 'lump sum (15th/30th)',
  [1]: 'daily',
  [2]: 'every 2 months',
  [3]: 'quarterly',
  [4]: 'every 4 months',
  [6]: 'semi-annual',
  [7]: 'weekly',
  [15]: 'semi-monthly (every 15 days)',
  [30]: 'monthly (every 30 days)'
}

export const SetInstallmentType = (type: number): string =>
  INSTALLMENT_TYPES[type as keyof typeof INSTALLMENT_TYPES] ?? 'None'