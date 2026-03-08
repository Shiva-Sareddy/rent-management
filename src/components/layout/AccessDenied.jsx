import { useNavigate, useLocation } from "react-router-dom";
import Button from "../ui/Button";

/**
 * AccessDenied component
 * Displayed when user tries to access a protected route without authentication
 * Shows a friendly message with spooky ghost style and provides buttons to navigate
 */
export default function AccessDenied() {
  const navigate = useNavigate();
  const location = useLocation();

  // Store the current location to redirect back after login
  const from = location.state?.from?.pathname || "/dashboard";

  const handleGoToLogin = () => {
    // Navigate to login with the original location stored in state
    navigate("/login", { state: { from: location } });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: "#313942",
        fontFamily:
          '"DM Sans", "Montserrat", "Open Sans", system-ui, sans-serif',
      }}>
      <main
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          justifyContent: "center",
          textAlign: "center",
          padding: "1rem",
        }}>
        <h1
          style={{
            color: "#e7ebf2",
            fontSize: "clamp(4rem, 20vw, 12.5rem)",
            fontWeight: 900,
            letterSpacing: ".05em",
            margin: "0",
            textShadow: ".05em .05em 0 rgba(0,0,0,.25)",
            whiteSpace: "nowrap",
            lineHeight: 1,
          }}>
          4
          <span
            style={{
              animation: "spooky 2s alternate infinite linear",
              color: "#528cce",
              display: "inline-block",
              marginInline: "-0.15em",
            }}>
            👻
          </span>
          4
        </h1>
        <h2
          style={{
            color: "#e7ebf2",
            marginTop: "1.5em",
            marginBottom: ".40em",
            fontSize: "clamp(1.5rem, 5vw, 2rem)",
            fontWeight: "700",
          }}>
          Access Denied
        </h2>
        <p
          style={{
            color: "#ccc",
            marginTop: 0,
            marginBottom: "2rem",
            fontSize: "clamp(0.875rem, 3vw, 1.1rem)",
            maxWidth: "400px",
          }}>
          You must be logged in to access this page. Please login to continue.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: "300px",
          }}>
          <Button onClick={handleGoToLogin} className="w-full">
            Go to Login
          </Button>
        </div>
      </main>

      <style>{`
        @keyframes spooky {
          from {
            transform: translateY(0.15em) scaleY(0.95);
          }
          to {
            transform: translateY(-0.15em);
          }
        }
      `}</style>
    </div>
  );
}
