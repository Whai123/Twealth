import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Use the same approach as useAuth - handle 401s gracefully
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <UserContext.Provider value={{ user: (user as User) || null, isLoading, error }}>
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