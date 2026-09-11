import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MyRequests.css";

function MyRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const currentUser = JSON.parse(localStorage.getItem("user"));

      if (!currentUser) {
        navigate("/login");
        return;
      }

      // Backend user object uses "id"
      const customerId = currentUser.id || currentUser.userId;

      if (!customerId) {
        setError("Unable to identify your customer account.");
        return;
      }

      const response = await axios.get(
        `http://localhost:8080/api/requests/customer/${customerId}`
      );

      setRequests(response.data);
    } catch (err) {
      console.error("Error loading requests:", err);

      if (err.response) {
        setError(
          "Unable to load your service requests."
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

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchRequests();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "status-completed";

      case "IN_PROGRESS":
        return "status-progress";

      case "ASSIGNED":
        return "status-assigned";

      case "CANCELLED":
        return "status-cancelled";

      default:
        return "status-pending";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "URGENT":
        return "priority-urgent";

      case "HIGH":
        return "priority-high";

      case "LOW":
        return "priority-low";

      default:
        return "priority-medium";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "In Progress";

      case "COMPLETED":
        return "Completed";

      case "ASSIGNED":
        return "Assigned";

      case "CANCELLED":
        return "Cancelled";

      default:
        return "Pending";
    }
  };

  return (
    <div className="requests-page">

      {/* HEADER */}
      <div className="requests-header">

        <div>
          <p className="requests-label">
            MY SERVICES
          </p>

          <h1>
            My Requests
          </h1>

          <p>
            Track and manage all your service requests in one place.
          </p>
        </div>

        <div className="header-buttons">

          <button
            className="dashboard-button"
            onClick={() => navigate("/customer")}
          >
            Back to Dashboard
          </button>

          <button
            className="new-request-button"
            onClick={() => navigate("/request-service")}
          >
            + New Request
          </button>

        </div>

      </div>

      {/* SUMMARY */}
      <div className="requests-summary">

        <div className="summary-card">
          <div className="summary-icon">
            #
          </div>

          <div>
            <span>Total Requests</span>

            <strong>
              {requests.length}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            !
          </div>

          <div>
            <span>Pending</span>

            <strong>
              {
                requests.filter(
                  (request) =>
                    request.status === "PENDING"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            W
          </div>

          <div>
            <span>In Progress</span>

            <strong>
              {
                requests.filter(
                  (request) =>
                    request.status === "IN_PROGRESS"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            ✓
          </div>

          <div>
            <span>Completed</span>

            <strong>
              {
                requests.filter(
                  (request) =>
                    request.status === "COMPLETED"
                ).length
              }
            </strong>
          </div>
        </div>

      </div>

      {/* CONTENT */}
      <div className="requests-container">

        <div className="section-heading">

          <div>
            <h2>
              Service Requests
            </h2>

            <p>
              Your latest service activity
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={fetchRequests}
            disabled={loading}
          >
            Refresh
          </button>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="requests-empty">

            <div className="empty-icon">
              ...
            </div>

            <h3>
              Loading your requests...
            </h3>

            <p>
              Please wait a moment.
            </p>

          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="requests-empty error-state">

            <div className="empty-icon">
              !
            </div>

            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>

            <button
              className="retry-button"
              onClick={fetchRequests}
            >
              Try Again
            </button>

          </div>
        )}

        {/* NO REQUESTS */}
        {!loading &&
          !error &&
          requests.length === 0 && (

            <div className="requests-empty">

              <div className="empty-icon">
                +
              </div>

              <h3>
                No service requests yet
              </h3>

              <p>
                You haven't submitted any service requests.
              </p>

              <button
                className="new-request-button"
                onClick={() => navigate("/request-service")}
              >
                + Create Your First Request
              </button>

            </div>
          )}

        {/* REQUEST LIST */}
        {!loading &&
          !error &&
          requests.length > 0 && (

            <div className="request-list">

              {requests.map((request) => (

                <div
                  className="request-card"
                  key={request.id}
                >

                  {/* CARD HEADER */}
                  <div className="request-card-header">

                    <div className="request-title-area">

                      <span className="request-number">
                        REQUEST #{request.id}
                      </span>

                      <h3>
                        {request.title}
                      </h3>

                    </div>

                    <span
                      className={`status-badge ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {getStatusText(request.status)}
                    </span>

                  </div>

                  {/* DESCRIPTION */}
                  <p className="request-description">
                    {request.description}
                  </p>

                  {/* DETAILS */}
                  <div className="request-details">

                    <div className="detail-item">

                      <span className="detail-label">
                        SERVICE
                      </span>

                      <strong>
                        {request.serviceType}
                      </strong>

                    </div>

                    <div className="detail-item">

                      <span className="detail-label">
                        LOCATION
                      </span>

                      <strong>
                        {request.location}
                      </strong>

                    </div>

                    <div className="detail-item">

                      <span className="detail-label">
                        PRIORITY
                      </span>

                      <span
                        className={`priority-badge ${getPriorityClass(
                          request.priority
                        )}`}
                      >
                        {request.priority}
                      </span>

                    </div>

                    <div className="detail-item">

                      <span className="detail-label">
                        TECHNICIAN
                      </span>

                      <strong>
                        {request.technicianId
                          ? `Technician #${request.technicianId}`
                          : "Not Assigned"}
                      </strong>

                    </div>

                  </div>

                  {/* FOOTER */}
                  <div className="request-footer">

                    <span>
                      Created:{" "}
                      {request.createdAt
                        ? new Date(
                            request.createdAt
                          ).toLocaleString()
                        : "Recently created"}
                    </span>

                    {request.status === "PENDING" && (
                      <span className="footer-status">
                        Waiting for technician assignment
                      </span>
                    )}

                    {request.status === "ASSIGNED" && (
                      <span className="footer-status">
                        Technician assigned
                      </span>
                    )}

                    {request.status === "IN_PROGRESS" && (
                      <span className="footer-status">
                        Service is currently in progress
                      </span>
                    )}

                    {request.status === "COMPLETED" && (
                      <span className="footer-status completed-footer">
                        ✓ Service completed
                      </span>
                    )}

                    {request.status === "CANCELLED" && (
                      <span className="footer-status">
                        Service request cancelled
                      </span>
                    )}

                  </div>

                </div>

              ))}

            </div>
          )}

      </div>

    </div>
  );
}

export default MyRequests;