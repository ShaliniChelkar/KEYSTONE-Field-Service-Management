import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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
    <div className="profile-page">
      <div className="profile-container">

        {/* Header */}
        <div className="profile-header">
          <div>
            <p className="profile-label">ACCOUNT</p>
            <h1>My Profile</h1>
            <p>
              View and manage your KEYSTONE account information.
            </p>
          </div>

          <button
            className="back-dashboard-button"
            onClick={() => navigate("/customer")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Profile Card */}
        <div className="profile-card">

          <div className="profile-top">
            <div className="profile-avatar">
              {user.name
                ? user.name.charAt(0).toUpperCase()
                : "C"}
            </div>

            <div className="profile-identity">
              <h2>{user.name || "Customer"}</h2>
              <p>{user.email || "No email available"}</p>

              <span className="role-badge">
                {user.role || "CUSTOMER"}
              </span>
            </div>
          </div>

          <div className="profile-divider"></div>

          {/* Information */}
          <div className="profile-section">
            <h3>Personal Information</h3>

            <div className="profile-grid">

              <div className="profile-field">
                <span>FULL NAME</span>
                <strong>{user.name || "Not provided"}</strong>
              </div>

              <div className="profile-field">
                <span>EMAIL ADDRESS</span>
                <strong>{user.email || "Not provided"}</strong>
              </div>

              <div className="profile-field">
                <span>PHONE NUMBER</span>
                <strong>{user.phone || "Not provided"}</strong>
              </div>

              <div className="profile-field">
                <span>ACCOUNT ROLE</span>
                <strong>{user.role || "CUSTOMER"}</strong>
              </div>

              <div className="profile-field">
                <span>USER ID</span>
                <strong>#{user.id || user.userId || "N/A"}</strong>
              </div>

              <div className="profile-field">
                <span>ACCOUNT STATUS</span>
                <strong className="active-status">
                  ● Active
                </strong>
              </div>

            </div>
          </div>

          <div className="profile-divider"></div>

          {/* Actions */}
          <div className="profile-actions">
            <button
              className="profile-secondary-button"
              onClick={() => navigate("/my-requests")}
            >
              View My Requests
            </button>

            <button
              className="profile-primary-button"
              onClick={() => navigate("/request-service")}
            >
              + Request a Service
            </button>

            <button
              className="profile-logout-button"
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

export default Profile;