import { useAuthStore } from '../store/authStore';

export const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
  const settings = useAuthStore.getState().tenantSettings;
  const symbol = settings?.currency_symbol || 'Bs.';
  const formatter = new Intl.NumberFormat('es-BO', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const formattedAmount = formatter.format(amount);
  
  if (showSymbol) {
    return \\ \\;
  }
  return formattedAmount;
};

export const getCurrencySymbol = (): string => {
  return useAuthStore.getState().tenantSettings?.currency_symbol || 'Bs.';
};
