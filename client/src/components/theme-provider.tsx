import { createContext, useContext, useEffect, useState } from"react";
import { useQuery } from"@tanstack/react-query";

type Theme ="light" |"dark" |"system";

type ThemeProviderProps = {
 children: React.ReactNode;
 defaultTheme?: Theme;
 storageKey?: string;
};

type ThemeProviderState = {
 theme: Theme;
 setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
 theme:"system",
 setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
 children,
 defaultTheme ="system",
 storageKey ="twealth-theme",
 ...props
}: ThemeProviderProps) {
 const [theme, setTheme] = useState<Theme>(() => {
  // Check localStorage first for immediate theme application
  if (typeof window !=="undefined") {
   const stored = localStorage.getItem(storageKey);
   if (stored && ["light","dark","system"].includes(stored)) {
    return stored as Theme;
   }
  }
  return defaultTheme;
 });

 const [hasInitialized, setHasInitialized] = useState(false);

 // Fetch user preferences from API
 const { data: userPreferences } = useQuery<{ theme?: Theme }>({
  queryKey: ["/api/user-preferences"],
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
 });

 // Update theme when user preferences are loaded (only on initial load)
 useEffect(() => {
  if (!hasInitialized && userPreferences?.theme) {
   const storedTheme = typeof window !=="undefined" ? localStorage.getItem(storageKey) : null;
   
   // Only sync from API if localStorage doesn't have a value or if they match
   if (!storedTheme || storedTheme === userPreferences.theme) {
    setTheme(userPreferences.theme);
    localStorage.setItem(storageKey, userPreferences.theme);
   }
   setHasInitialized(true);
  }
 }, [userPreferences?.theme, hasInitialized, storageKey]);

 useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove("light","dark");

  if (theme ==="system") {
   const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ?"dark"
    :"light";

   root.classList.add(systemTheme);
   return;
  }

  root.classList.add(theme);
 }, [theme]);

 // Listen for system theme changes when theme is set to"system"
 useEffect(() => {
  if (theme !=="system") return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  
  const handleChange = () => {
   const root = window.document.documentElement;
   root.classList.remove("light","dark");
   
   const systemTheme = mediaQuery.matches ?"dark" :"light";
   root.classList.add(systemTheme);
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
 }, [theme]);

 const value = {
  theme,
  setTheme: (newTheme: Theme) => {
   localStorage.setItem(storageKey, newTheme);
   setTheme(newTheme);
  },
 };

 return (
  <ThemeProviderContext.Provider {...props} value={value}>
   {children}
  </ThemeProviderContext.Provider>
 );
}

export const useTheme = () => {
 const context = useContext(ThemeProviderContext);

 if (context === undefined)
  throw new Error("useTheme must be used within a ThemeProvider");

 return context;
};