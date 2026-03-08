import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const eyesLocked = useRef(false);

  // Get the origin location from state (where the user tried to access)
  const from = location.state?.from?.pathname || "/dashboard";

  // GSAP-like animation functions
  useEffect(() => {
    const allEyes = document.querySelectorAll(".eyes span");

    // Follow mouse
    const handleMouseMove = (e) => {
      if (eyesLocked.current) return;

      allEyes.forEach((eye) => {
        const r = eye.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const angle = Math.atan2(dy, dx);

        eye.style.transform = `translate(${Math.cos(angle) * 7}px, ${Math.sin(angle) * 7}px)`;
      });
    };

    // Blink animation
    const blinkAll = () => {
      if (eyesLocked.current) return;

      allEyes.forEach((eye) => {
        eye.style.transition = "transform 0.1s";
        eye.style.transform = "scaleY(0.15)";
        setTimeout(() => {
          eye.style.transform = "scaleY(1)";
        }, 100);
      });
    };

    const blinkInterval = setInterval(blinkAll, 2600);

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearInterval(blinkInterval);
    };
  }, []);

  // Email input - open mouth
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    const mouths = document.querySelectorAll(".mouth");
    mouths.forEach((mouth) => {
      mouth.style.transition = "transform 0.15s";
      mouth.style.transform = "translateX(-50%) scaleY(1.6) scaleX(1.2)";
    });
  };

  const handleEmailBlur = () => {
    const mouths = document.querySelectorAll(".mouth");
    mouths.forEach((mouth) => {
      mouth.style.transition = "transform 0.2s";
      mouth.style.transform = "translateX(-50%) scaleY(1) scaleX(1)";
    });
  };

  // Password focus - close mouth
  const handlePasswordFocus = () => {
    const mouths = document.querySelectorAll(".mouth");
    mouths.forEach((mouth) => {
      mouth.style.transition = "transform 0.2s";
      mouth.style.transform = "translateX(-50%) scaleY(1) scaleX(1)";
    });
  };

  // Toggle password visibility
  const togglePassword = () => {
    setShowPassword(!showPassword);
    const eyes = document.querySelectorAll(".eyes span");

    if (!showPassword) {
      eyesLocked.current = true;
      eyes.forEach((eye) => {
        eye.style.transition = "transform 0.2s";
        eye.style.transform = "translateX(-8.4px)";
      });
    } else {
      eyesLocked.current = false;
      eyes.forEach((eye) => {
        eye.style.transition = "transform 0.25s";
        eye.style.transform = "translateX(0)";
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else navigate(from, { replace: true });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setError("Account created! Please login.");
  };

  return (
    <div
      className="login-page"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: '"DM Sans", sans-serif',
        padding: "24px",
        boxSizing: "border-box",
      }}>
      <div
        className="login-card"
        style={{
          width: "100%",
          maxWidth: "1100px",
          background: "#fff",
          display: "flex",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 25px 50px rgba(0,0,0,.15)",
        }}>
        {/* LEFT - ILLUSTRATION */}
        <div
          className="illustration"
          style={{
            width: "50%",
            background: "#f0f0f0",
            position: "relative",
            overflow: "visible",
          }}>
          <div
            className="shapes"
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: "100%",
            }}>
            {/* PURPLE SHAPE */}
            <div
              className="shape purple"
              style={{
                position: "absolute",
                bottom: 0,
                left: "28%",
                width: "130px",
                height: "280px",
                background: "#7c3aed",
                zIndex: 2,
                transition: "transform .3s",
              }}>
              <div
                className="eyes no-pupil"
                style={{
                  position: "absolute",
                  top: "40px",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: "18px",
                }}>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#fff",
                    borderRadius: "50%",
                    position: "relative",
                  }}></span>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#fff",
                    borderRadius: "50%",
                    position: "relative",
                  }}></span>
              </div>
              <div
                className="mouth"
                style={{
                  position: "absolute",
                  top: "70px",
                  left: "50%",
                  width: "20px",
                  height: "6px",
                  background: "rgba(0,0,0,.3)",
                  borderRadius: "0 0 20px 20px",
                  transform: "translateX(-50%)",
                }}></div>
            </div>

            {/* DARK SHAPE */}
            <div
              className="shape dark"
              style={{
                position: "absolute",
                bottom: 0,
                left: "52%",
                width: "110px",
                height: "180px",
                background: "#111",
                zIndex: 3,
                transition: "transform .3s",
              }}>
              <div
                className="eyes dark-eyes"
                style={{
                  position: "absolute",
                  top: "40px",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: "18px",
                }}>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#fff",
                    borderRadius: "50%",
                    position: "relative",
                  }}></span>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#fff",
                    borderRadius: "50%",
                    position: "relative",
                  }}></span>
              </div>
            </div>

            {/* YELLOW SHAPE */}
            <div
              className="shape yellow"
              style={{
                position: "absolute",
                bottom: 0,
                left: "60%",
                width: "130px",
                height: "130px",
                background: "#facc15",
                borderRadius: "60px 60px 0 0",
                zIndex: 4,
                transition: "transform .3s",
              }}>
              <div
                className="eyes orange-eyes"
                style={{
                  position: "absolute",
                  top: "40px",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: "18px",
                }}>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#000",
                    borderRadius: "50%",
                  }}></span>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#000",
                    borderRadius: "50%",
                  }}></span>
              </div>
              <span
                className="mouth big"
                style={{
                  position: "absolute",
                  top: "70px",
                  left: "50%",
                  width: "40px",
                  height: "10px",
                  background: "rgba(0,0,0,.6)",
                  borderRadius: "0 0 20px 20px",
                  transform: "translateX(-50%)",
                }}></span>
            </div>

            {/* ORANGE SHAPE */}
            <div
              className="shape orange"
              style={{
                position: "absolute",
                bottom: 0,
                left: "18%",
                width: "260px",
                height: "120px",
                background: "#f97316",
                borderRadius: "100px 100px 0 0",
                zIndex: 5,
                transition: "transform .3s",
              }}>
              <div
                className="eyes orange-eyes"
                style={{
                  position: "absolute",
                  top: "40px",
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: "18px",
                }}>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#000",
                    borderRadius: "50%",
                  }}></span>
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    background: "#000",
                    borderRadius: "50%",
                  }}></span>
              </div>
              <div
                className="mouth big"
                style={{
                  position: "absolute",
                  top: "70px",
                  left: "50%",
                  width: "40px",
                  height: "10px",
                  background: "rgba(0,0,0,.6)",
                  borderRadius: "0 0 20px 20px",
                  transform: "translateX(-50%)",
                }}></div>
            </div>
          </div>
        </div>

        {/* RIGHT - FORM */}
        <div
          className="form-container"
          style={{
            width: "100%",
            padding: "50px 30px",
            display: "flex",
            alignItems: "center",
          }}>
          <div
            className="form-wrapper"
            style={{ maxWidth: "360px", margin: "auto", width: "100%" }}>
            <div
              className="header"
              style={{ textAlign: "center", marginBottom: "32px" }}>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  marginTop: "12px",
                  marginBottom: "8px",
                  color: "#111",
                }}>
                Welcome back!
              </h1>
              <p style={{ color: "#666", margin: 0 }}>
                Please enter your details
              </p>
            </div>

            <form onSubmit={isSignup ? handleSignup : handleLogin}>
              <div className="field" style={{ marginTop: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#333",
                  }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "1px solid #ccc",
                    padding: "8px 0",
                    fontSize: "1rem",
                    outline: "none",
                    fontFamily: '"DM Sans", sans-serif',
                    background: "transparent",
                  }}
                />
              </div>

              <div className="field" style={{ marginTop: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    color: "#333",
                  }}>
                  Password
                </label>
                <div className="password" style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={handlePasswordFocus}
                    style={{
                      width: "100%",
                      border: "none",
                      borderBottom: "1px solid #ccc",
                      padding: "8px 0",
                      fontSize: "1rem",
                      outline: "none",
                      fontFamily: '"DM Sans", sans-serif',
                      background: "transparent",
                      color: "#000",
                    }}
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: "8px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}>
                    <span
                      className="material-icons-outlined"
                      style={{ fontSize: "20px", color: "#000" }}>
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <p
                  style={{
                    color: "#dc2626",
                    fontSize: "0.875rem",
                    marginBottom: "12px",
                  }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "999px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  marginTop: "12px",
                  background: "#000",
                  color: "#fff",
                  fontSize: "1rem",
                  fontFamily: '"DM Sans", sans-serif',
                }}>
                Log In
              </button>
            </form>

            <p
              className="signup"
              style={{
                textAlign: "center",
                marginTop: "24px",
                color: "#666",
              }}>
              {isSignup
                ? "Already have an account? "
                : "Don't have an account? "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsSignup(!isSignup);
                  setError("");
                }}
                style={{
                  color: "#000",
                  textDecoration: "none",
                  fontWeight: 600,
                }}>
                {isSignup ? "Log In" : "Sign Up"}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        .login-page {
          width: 100%;
          min-height: 100vh;
        }
        
        .login-card {
          width: 100%;
        }
        
        /* Desktop styles - above 900px */
        @media (min-width: 901px) {
          .form-container {
            width: 50% !important;
          }
          
          .illustration {
            width: 50%;
          }
        }
        
        @media (max-width: 900px) {
          .login-card {
            flex-direction: column;
            max-width: 500px;
          }
          
          .illustration,
          .form-container {
            width: 100%;
          }
          
          .illustration {
            height: 260px;
          }
        }
        
        @media (max-width: 768px) {
          .login-page {
            padding: 16px;
            align-items: flex-start;
            padding-top: 24px;
            padding-bottom: 24px;
          }
          
          .login-card {
            border-radius: 16px;
          }
          
          .form-container {
            padding: 24px 20px;
          }
          
          .form-wrapper {
            max-width: 100% !important;
          }
          
          .header {
            margin-bottom: 20px !important;
          }
          
          .header h1 {
            font-size: 1.375rem !important;
            margin-top: 6px !important;
            margin-bottom: 4px !important;
          }
          
          .header p {
            font-size: 0.8125rem !important;
          }
          
          .field {
            margin-top: 16px !important;
          }
          
          .field label {
            font-size: 0.8125rem !important;
            margin-bottom: 4px !important;
          }
          
          .field input {
            font-size: 0.9375rem !important;
            padding: 8px 0 !important;
          }
          
          .row {
            margin: 14px 0 !important;
            flex-direction: column;
            align-items: flex-start !important;
            gap: 10px;
          }
          
          .checkbox, 
          .checkbox + a {
            font-size: 0.75rem !important;
          }
          
          .btn.primary {
            padding: 12px !important;
            font-size: 0.9375rem !important;
            margin-top: 12px !important;
          }
          
          .signup {
            margin-top: 14px !important;
            font-size: 0.8125rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .login-page {
            padding: 12px;
            align-items: center;
            padding-top: 16px;
            padding-bottom: 16px;
          }
          
          .login-card {
            border-radius: 12px;
          }
          
          .form-container {
            padding: 20px 16px;
          }
          
          .form-wrapper {
            max-width: 100% !important;
          }
          
          .header {
            margin-bottom: 16px !important;
          }
          
          .header h1 {
            font-size: 1.25rem !important;
          }
          
          .header p {
            font-size: 0.75rem !important;
          }
          
          .field {
            margin-top: 14px !important;
          }
          
          .field label {
            font-size: 0.75rem !important;
          }
          
          .field input {
            font-size: 0.875rem !important;
            padding: 6px 0 !important;
          }
          
          .btn.primary {
            padding: 10px !important;
            margin-top: 10px !important;
            font-size: 0.875rem !important;
          }
          
          .signup {
            margin-top: 12px !important;
            font-size: 0.75rem !important;
          }
        }
        
        @media (max-width: 360px) {
          .login-page {
            padding: 8px;
          }
          
          .form-container {
            padding: 16px 12px;
          }
          
          .form-wrapper {
            max-width: 100% !important;
          }
          
          .header h1 {
            font-size: 1.125rem !important;
          }
          
          .header p {
            font-size: 0.6875rem !important;
          }
          
          .field label {
            font-size: 0.6875rem !important;
          }
          
          .field input {
            font-size: 0.8125rem !important;
          }
        }
      `}</style>
    </div>
  );
}
