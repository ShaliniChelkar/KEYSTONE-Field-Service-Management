import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          email: email.trim(),
          password: password,
        }
      );

      console.log("LOGIN RESPONSE:", response.data);

      const user = response.data;

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "CUSTOMER") {
        navigate("/customer");
      } else if (user.role === "TECHNICIAN") {
        navigate("/technician");
      } else if (user.role === "DISPATCHER") {
        navigate("/dispatcher");
      } else if (user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/login");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Invalid email or password."
        );
      } else {
        setError(
          "Unable to connect to the server. Make sure Spring Boot is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT BRAND PANEL */}
      <div className="login-brand-panel">

        <div className="brand-content">

          <div className="brand-logo">
            K
          </div>

          <div className="brand-name">
            <h1>KEYSTONE</h1>
            <span>FIELD SERVICE MANAGEMENT</span>
          </div>

          <div className="brand-divider"></div>

          <h2>
            Smarter Service.
            <br />
            Better Operations.
          </h2>

          <p>
            A centralized platform to manage service
            requests, dispatch technicians, track
            SLA performance, and streamline field
            service operations.
          </p>

          <div className="login-features">

            <div className="login-feature">
              <div className="feature-icon">✓</div>
              <div>
                <strong>Smart Dispatching</strong>
                <span>
                  Assign and manage technicians efficiently
                </span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">◷</div>
              <div>
                <strong>SLA Monitoring</strong>
                <span>
                  Track deadlines and service performance
                </span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">▣</div>
              <div>
                <strong>Complete Visibility</strong>
                <span>
                  Monitor operations from one platform
                </span>
              </div>
            </div>

          </div>

        </div>

        <div className="brand-footer">
          <span>KEYSTONE</span>
          <span>•</span>
          <span>Field Service Management System</span>
        </div>

      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="login-form-panel">

        <div className="login-form-wrapper">

          <div className="mobile-brand">
            <div className="mobile-logo">K</div>
            <strong>KEYSTONE</strong>
          </div>

          <div className="login-heading">

            <span className="login-eyebrow">
              SECURE ACCESS
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in to continue to your KEYSTONE
              workspace.
            </p>

          </div>

          {error && (
            <div className="login-error">
              <span className="error-icon">!</span>

              <div>
                <strong>Login failed</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* EMAIL */}
            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div className="form-group">

              <div className="password-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setError(
                      "Please contact the system administrator to reset your password."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <div className="input-wrapper">

                <span className="input-icon">
                  ●
                </span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* REMEMBER ME */}
            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                />

                <span className="custom-checkbox"></span>

                <span>Remember me</span>

              </label>

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          {/* REGISTER */}
          <div className="register-section">

            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create an account
            </Link>

          </div>

          <div className="login-security">

            <span className="security-dot"></span>

            Secure KEYSTONE access

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;