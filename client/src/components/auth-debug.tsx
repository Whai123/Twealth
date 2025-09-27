import { useAuth } from "../hooks/useAuth";

export function AuthDebug() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  console.log("AuthDebug:", { user, isLoading, isAuthenticated });
  
  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      right: 0, 
      background: "red", 
      color: "white", 
      padding: "10px",
      zIndex: 9999,
      fontSize: "12px"
    }}>
      <div>Loading: {isLoading ? "true" : "false"}</div>
      <div>Authenticated: {isAuthenticated ? "true" : "false"}</div>
      <div>User: {user ? JSON.stringify(user) : "null"}</div>
    </div>
  );
}