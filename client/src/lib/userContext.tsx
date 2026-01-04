import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPreferences } from "@shared/schema";
import { formatCurrency, convertCurrency, getCurrencySymbol, CURRENCIES } from "./currency";
import { getQueryFn } from "./queryClient";

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  preferences: UserPreferences | null;
  preferencesLoading: boolean;
  currency: string;
  currencySymbol: string;
  formatAmount: (amount: number, options?: { compact?: boolean; showSymbol?: boolean }) => string;
  convertFromUSD: (amountUSD: number) => number;
  convertToUSD: (amount: number) => number;
  getUserName: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ["/api/users/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: preferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/user-preferences"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const currency = preferences?.currency || "USD";
  const currencySymbol = getCurrencySymbol(currency);

  const contextValue = useMemo<UserContextType>(() => ({
    user: user || null,
    isLoading: userLoading,
    error: userError || null,
    preferences: preferences || null,
    preferencesLoading,
    currency,
    currencySymbol,
    
    formatAmount: (amount: number, options?: { compact?: boolean; showSymbol?: boolean }) => {
      return formatCurrency(amount, currency, {
        compact: options?.compact,
        showSymbol: options?.showSymbol ?? true,
      });
    },
    
    convertFromUSD: (amountUSD: number) => {
      if (currency === "USD") return amountUSD;
      return convertCurrency(amountUSD, "USD", currency);
    },
    
    convertToUSD: (amount: number) => {
      if (currency === "USD") return amount;
      return convertCurrency(amount, currency, "USD");
    },
    
    getUserName: () => {
      const onboardingData = preferences?.onboardingData as { fullName?: string } | null;
      if (onboardingData?.fullName) return onboardingData.fullName;
      if (user?.firstName) return user.firstName;
      if (user?.username) return user.username;
      return "there";
    },
  }), [user, userLoading, userError, preferences, preferencesLoading, currency, currencySymbol]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

export function useUserId() {
  const { user } = useUser();
  return user?.id;
}

export function useUserCurrency() {
  const { currency, currencySymbol, formatAmount, convertFromUSD, convertToUSD } = useUser();
  return { currency, currencySymbol, formatAmount, convertFromUSD, convertToUSD };
}

export function useUserPreferences() {
  const { preferences, preferencesLoading, getUserName } = useUser();
  return { preferences, isLoading: preferencesLoading, getUserName };
}
