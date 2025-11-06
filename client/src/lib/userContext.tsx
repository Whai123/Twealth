import { createContext, useContext, useState, useEffect } from"react";
import { useQuery } from"@tanstack/react-query";

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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
 const { data: user, isLoading, error } = useQuery({
  queryKey: ["/api/users/me"],
  queryFn: () => fetch("/api/users/me").then(res => {
   if (!res.ok) throw new Error("Failed to fetch user");
   return res.json();
  }),
  staleTime: 5 * 60 * 1000, // 5 minutes
 });

 return (
  <UserContext.Provider value={{ user: user || null, isLoading, error }}>
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

// Helper function to get user ID for API calls
export function useUserId() {
 const { user } = useUser();
 return user?.id;
}