import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function AuthCallback({ setIsAuthenticated, setUserRole }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");
    const error = searchParams.get("error");

    if (error) {
      // Handle OAuth errors
      console.error("OAuth error:", error);
      navigate(`/login?error=${error}`);
      return;
    }

    if (token && role) {
      try {
        // Decode and validate token
        const decoded = jwtDecode(token);
        
        // Store token
        localStorage.setItem("token", token);
        
        // Get user data from URL params (sent from backend)
        const userDataParam = searchParams.get("user");
        if (userDataParam) {
          try {
            const userData = JSON.parse(decodeURIComponent(userDataParam));
            localStorage.setItem("user", JSON.stringify(userData));
            
            // Update app state
            setUserRole(role);
            setIsAuthenticated(true);
            
            // Redirect to appropriate dashboard
            if (role === "teacher") {
              navigate("/teacher-dashboard");
            } else {
              navigate("/student-dashboard");
            }
            return;
          } catch (parseError) {
            console.error("Error parsing user data:", parseError);
          }
        }
        
        // Fallback: Fetch user data from backend if not in URL
        const fetchUserData = async () => {
          try {
            const endpoint = role === "teacher" 
              ? `/api/teachers/${decoded.id}` 
              : `/api/students/${decoded.id}`;
            
            const response = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const userData = await response.json();
              localStorage.setItem("user", JSON.stringify(userData));
              
              // Update app state
              setUserRole(role);
              setIsAuthenticated(true);
              
              // Redirect to appropriate dashboard
              if (role === "teacher") {
                navigate("/teacher-dashboard");
              } else {
                navigate("/student-dashboard");
              }
            } else {
              throw new Error("Failed to fetch user data");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            navigate("/login?error=fetch_user_failed");
          }
        };

        fetchUserData();
      } catch (error) {
        console.error("Token decode error:", error);
        navigate("/login?error=invalid_token");
      }
    } else {
      navigate("/login?error=missing_token");
    }
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
