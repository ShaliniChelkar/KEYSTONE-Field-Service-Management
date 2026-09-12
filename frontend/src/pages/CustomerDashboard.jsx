import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const currentUser = JSON.parse(savedUser);

      setUser(currentUser);
      fetchRequests(currentUser);
    } catch (error) {
      console.error("Invalid user data:", error);

      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const fetchRequests = async (currentUser) => {
    try {
      setLoadingRequests(true);

      const customerId =
        currentUser?.id || currentUser?.userId;

      if (!customerId) {
        console.error("Customer ID not found.");
        return;
      }

      const response = await api.get(
        `/requests/customer/${customerId}`
      );

      setRequests(response.data || []);
    } catch (error) {
      console.error(
        "Error loading customer requests:",
        error
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* =========================
     REQUEST STATISTICS
  ========================= */

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  ).length;

  const completedRequests = requests.filter(
    (request) => request.status === "COMPLETED"
  ).length;

  const inProgressRequests = requests.filter(
    (request) => request.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="customer-dashboard">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            K
          </div>

          <div>
            <h2>KEYSTONE</h2>
            <span>Field Service</span>
          </div>
        </div>

        <nav className="sidebar-menu">

          {/* Dashboard */}
          <button
            className="menu-item active"
            onClick={() => navigate("/customer")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          {/* Request Service */}
          <button
            className="menu-item"
            onClick={() => navigate("/request-service")}
          >
            <span>🔧</span>
            Request Service
          </button>

          {/* My Requests */}
          <button
            className="menu-item"
            onClick={() => navigate("/my-requests")}
          >
            <span>📋</span>
            My Requests
          </button>

          {/* My Profile */}
          <button
            className="menu-item"
            onClick={() => navigate("/profile")}
          >
            <span>👤</span>
            My Profile
          </button>

        </nav>

        {/* =========================
            SIDEBAR BOTTOM
        ========================= */}

        <div className="sidebar-bottom">

          {/* Settings */}
          <button
            className="menu-item"
            onClick={() => navigate("/settings")}
          >
            <span>⚙</span>
            Settings
          </button>

          {/* Logout */}
          <button
            className="logout-button"
            onClick={logout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-header">

          <div>

            <p className="small-heading">
              CUSTOMER PORTAL
            </p>

            <h1>
              Welcome back,{" "}
              {user?.name || "Customer"} 👋
            </h1>

            <p className="header-description">
              Manage your service requests and track
              field technicians.
            </p>

          </div>

          <div className="header-actions">

            <button className="notification-button">
              🔔
              <span className="notification-dot"></span>
            </button>

            <div className="user-profile">

              <div className="avatar">
                {user?.name
                  ? user.name
                      .charAt(0)
                      .toUpperCase()
                  : "C"}
              </div>

              <div>

                <strong>
                  {user?.name || "Customer"}
                </strong>

                <small>
                  {user?.email || ""}
                </small>

              </div>

            </div>

          </div>

        </header>

        {/* =========================
            QUICK ACTION
        ========================= */}

        <section className="hero-card">

          <div className="hero-content">

            <div className="hero-icon">
              🔧
            </div>

            <div>

              <h2>
                Need a service?
              </h2>

              <p>
                Create a service request and we'll
                connect you with the right field
                technician.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/request-service")
                }
              >
                Request a Service
                <span>→</span>
              </button>

            </div>

          </div>

          <div className="hero-decoration">
            ⚙
          </div>

        </section>

        {/* =========================
            STATISTICS
        ========================= */}

        <section className="stats-grid">

          {/* TOTAL REQUESTS */}

          <div className="stat-card">

            <div className="stat-icon blue">
              📋
            </div>

            <div>

              <span>
                Total Requests
              </span>

              <strong>
                {loadingRequests
                  ? "..."
                  : totalRequests}
              </strong>

              <small>
                All service requests
              </small>

            </div>

          </div>

          {/* PENDING */}

          <div className="stat-card">

            <div className="stat-icon orange">
              ⏳
            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {loadingRequests
                  ? "..."
                  : pendingRequests}
              </strong>

              <small>
                Waiting for assignment
              </small>

            </div>

          </div>

          {/* COMPLETED */}

          <div className="stat-card">

            <div className="stat-icon green">
              ✓
            </div>

            <div>

              <span>
                Completed
              </span>

              <strong>
                {loadingRequests
                  ? "..."
                  : completedRequests}
              </strong>

              <small>
                Successfully completed
              </small>

            </div>

          </div>

          {/* IN PROGRESS */}

          <div className="stat-card">

            <div className="stat-icon purple">
              🔧
            </div>

            <div>

              <span>
                In Progress
              </span>

              <strong>
                {loadingRequests
                  ? "..."
                  : inProgressRequests}
              </strong>

              <small>
                Currently being serviced
              </small>

            </div>

          </div>

        </section>

        {/* =========================
            RECENT REQUESTS
        ========================= */}

        <section className="recent-section">

          <div className="section-header">

            <div>

              <h2>
                Recent Service Requests
              </h2>

              <p>
                View and track your latest requests.
              </p>

            </div>

            <button
              className="view-all-button"
              onClick={() =>
                navigate("/my-requests")
              }
            >
              View All
              <span>→</span>
            </button>

          </div>

          {/* LOADING */}

          {loadingRequests ? (

            <div className="recent-empty">

              <div className="recent-empty-icon">
                ...
              </div>

              <h3>
                Loading requests...
              </h3>

              <p>
                Please wait while we load your
                service requests.
              </p>

            </div>

          ) : requests.length === 0 ? (

            /* EMPTY */

            <div className="recent-empty">

              <div className="recent-empty-icon">
                📋
              </div>

              <h3>
                No recent requests
              </h3>

              <p>
                Your service requests will appear
                here.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/request-service")
                }
              >
                Create Service Request
                <span>→</span>
              </button>

            </div>

          ) : (

            /* REQUEST LIST */

            <div className="recent-request-list">

              {requests
                .slice()
                .reverse()
                .slice(0, 3)
                .map((request) => (

                  <div
                    className="recent-request-card"
                    key={request.id}
                  >

                    <div>

                      <span className="request-number">
                        REQUEST #{request.id}
                      </span>

                      <h3>
                        {request.title}
                      </h3>

                      <p>
                        {request.serviceType} •{" "}
                        {request.location}
                      </p>

                    </div>

                    <div className="recent-request-status">

                      <span>
                        {request.status
                          ?.replace("_", " ")}
                      </span>

                      <small>
                        {request.priority}
                      </small>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default CustomerDashboard;