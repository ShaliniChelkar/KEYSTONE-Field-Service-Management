import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch (error) {
      console.error("Invalid user data:", error);
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="settings-page">
      <div className="settings-container">

        <div className="settings-header">
          <div>
            <p className="settings-label">PREFERENCES</p>
            <h1>Settings</h1>
            <p>
              Manage your KEYSTONE account preferences.
            </p>
          </div>

          <button
            className="settings-back-button"
            onClick={() => navigate("/customer")}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="settings-card">

          <div className="settings-section">
            <div className="settings-section-heading">
              <div className="settings-icon">🔔</div>
              <div>
                <h2>Notifications</h2>
                <p>
                  Choose how you receive service updates.
                </p>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <strong>Service Notifications</strong>
                <span>
                  Receive updates about your service requests.
                </span>
              </div>

              <button
                className={`toggle-button ${
                  notifications ? "enabled" : ""
                }`}
                onClick={() =>
                  setNotifications(!notifications)
                }
                aria-label="Toggle service notifications"
              >
                <span></span>
              </button>
            </div>

            <div className="setting-row">
              <div>
                <strong>Email Updates</strong>
                <span>
                  Receive important service updates by email.
                </span>
              </div>

              <button
                className={`toggle-button ${
                  emailUpdates ? "enabled" : ""
                }`}
                onClick={() =>
                  setEmailUpdates(!emailUpdates)
                }
                aria-label="Toggle email updates"
              >
                <span></span>
              </button>
            </div>
          </div>

          <div className="settings-divider"></div>

          <div className="settings-section">
            <div className="settings-section-heading">
              <div className="settings-icon account-icon">
                👤
              </div>

              <div>
                <h2>Account</h2>
                <p>
                  Manage your KEYSTONE account.
                </p>
              </div>
            </div>

            <div className="account-info">
              <div>
                <span>ACCOUNT NAME</span>
                <strong>{user.name || "Customer"}</strong>
              </div>

              <div>
                <span>EMAIL ADDRESS</span>
                <strong>{user.email || "Not available"}</strong>
              </div>

              <div>
                <span>ACCOUNT ROLE</span>
                <strong>{user.role || "CUSTOMER"}</strong>
              </div>
            </div>
          </div>

          <div className="settings-divider"></div>

          <div className="settings-section danger-section">
            <div>
              <h2>Session</h2>
              <p>
                Sign out from your current KEYSTONE account.
              </p>
            </div>

            <button
              className="settings-logout-button"
              onClick={logout}
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Settings;