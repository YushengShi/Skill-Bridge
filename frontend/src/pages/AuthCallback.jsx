import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function AuthCallback({ setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const processAuth = async () => {
      const token = searchParams.get("token");
      const role = searchParams.get("role");
      const error = searchParams.get("error");

      console.log("AuthCallback - Processing auth:", { token: token ? "present" : "missing", role, error });

      if (error) {
        // Handle OAuth errors
        console.error("OAuth error:", error);
        navigate(`/login?error=${error}`);
        return;
      }

      if (!token || !role) {
        console.error("Missing token or role:", { token: !!token, role });
        navigate("/login?error=missing_token");
        return;
      }

      try {
        // Decode and validate token
        const decoded = jwtDecode(token);
        console.log("Token decoded successfully:", { id: decoded.id, role: decoded.role });
        
        // Store token
        localStorage.setItem("token", token);
        
        // Get user data from URL params (sent from backend)
        const userDataParam = searchParams.get("user");
        let userData = null;

        if (userDataParam) {
          try {
            userData = JSON.parse(decodeURIComponent(userDataParam));
            console.log("User data from URL:", userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } catch (parseError) {
            console.error("Error parsing user data from URL:", parseError);
          }
        }
        
        // If no user data from URL, fetch from backend
        if (!userData) {
          try {
            const endpoint = role === "teacher" 
              ? `/api/teachers/${decoded.id}` 
              : `/api/students/${decoded.id}`;
            
            console.log("Fetching user data from:", endpoint);
            const response = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              userData = await response.json();
              console.log("User data fetched:", userData);
              localStorage.setItem("user", JSON.stringify(userData));
            } else {
              const errorText = await response.text();
              console.error("Failed to fetch user data:", response.status, errorText);
              throw new Error(`Failed to fetch user data: ${response.status}`);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            navigate("/login?error=fetch_user_failed");
            return;
          }
        }

        // Update app state BEFORE navigation
        console.log("Setting authentication state:", { role, authenticated: true });
        
        // Update state and wait for it to propagate
        setUserRole(role);
        setIsAuthenticated(true);
        
        // Use window.location for a hard redirect to ensure state is read from localStorage
        // This ensures the App component's useEffect will pick up the token
        setTimeout(() => {
          console.log("Navigating to dashboard...");
          window.location.href = "/dashboard";
        }, 200);
        
      } catch (error) {
        console.error("Token decode error:", error);
        navigate("/login?error=invalid_token");
      }
    };

    processAuth();
  }, [searchParams, navigate, setIsAuthenticated, setUserRole]);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      flexDirection: "column",
      gap: "20px"
    }}>
      <div className="loading" style={{ width: "40px", height: "40px" }}></div>
      <p>Completing sign in...</p>
    </div>
  );
}

export default AuthCallback;
