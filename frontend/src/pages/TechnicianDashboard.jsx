import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./TechnicianDashboard.css";

function TechnicianDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expandedRequest, setExpandedRequest] = useState(null);

  const [timeLogs, setTimeLogs] = useState({});
  const [partUsages, setPartUsages] = useState({});

  const [loadingDetails, setLoadingDetails] = useState(null);

  const [timeForm, setTimeForm] = useState({
    startTime: "",
    endTime: "",
    description: "",
  });

  const [partForm, setPartForm] = useState({
    partName: "",
    partNumber: "",
    quantity: 1,
    unitCost: "",
    notes: "",
  });

  // ---------------------------------------
  // GET LOGGED-IN USER
  // ---------------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      const technicianId =
        parsedUser.id || parsedUser.userId;

      if (!technicianId) {
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setUser(parsedUser);
      fetchRequests(technicianId);
    } catch (err) {
      console.error("Invalid user data:", err);
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  // ---------------------------------------
  // FETCH REQUESTS
  // ---------------------------------------
  const fetchRequests = async (technicianId = null) => {
    try {
      setLoading(true);
      setError("");

      let id = technicianId;

      if (!id) {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
          navigate("/login");
          return;
        }

        const loggedInUser = JSON.parse(storedUser);

        id =
          loggedInUser.id ||
          loggedInUser.userId;
      }

      if (!id) {
        setError("Unable to identify technician account.");
        return;
      }

      const response = await api.get(
        `/requests/technician/${id}`
      );

      setRequests(response.data || []);
    } catch (err) {
      console.error("Error loading technician requests:", err);

      if (err.response) {
        setError(
          "Unable to load your assigned service requests."
        );
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // LOAD JOB DETAILS
  // ---------------------------------------
  const loadJobDetails = async (requestId) => {
    try {
      setLoadingDetails(requestId);
      setError("");

      const [timeResponse, partsResponse] =
        await Promise.all([
          api.get(
            `/time-logs/request/${requestId}`
          ),
          api.get(
            `/part-usages/request/${requestId}`
          ),
        ]);

      setTimeLogs((prev) => ({
        ...prev,
        [requestId]: timeResponse.data || [],
      }));

      setPartUsages((prev) => ({
        ...prev,
        [requestId]: partsResponse.data || [],
      }));
    } catch (err) {
      console.error("Error loading job details:", err);

      setError(
        "Unable to load time logs and parts information."
      );
    } finally {
      setLoadingDetails(null);
    }
  };

  // ---------------------------------------
  // TOGGLE JOB DETAILS
  // ---------------------------------------
  const toggleJobDetails = async (requestId) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
      return;
    }

    setExpandedRequest(requestId);

    await loadJobDetails(requestId);
  };

  // ---------------------------------------
  // REFRESH
  // ---------------------------------------
  const handleRefresh = () => {
    setSuccess("");
    setError("");
    fetchRequests();
  };

  // ---------------------------------------
  // UPDATE REQUEST STATUS
  // ---------------------------------------
  const updateStatus = async (requestId, newStatus) => {
    try {
      setUpdating(requestId);
      setError("");
      setSuccess("");

      await api.put(
        `/requests/${requestId}/status/${newStatus}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": String(
              user?.id || user?.userId || ""
            ),
            "X-User-Role": user?.role || "TECHNICIAN",
          },
        }
      );

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: newStatus,
              }
            : request
        )
      );

      if (newStatus === "IN_PROGRESS") {
        setSuccess(
          `Request #${requestId} is now in progress.`
        );
      }

      if (newStatus === "COMPLETED") {
        setSuccess(
          `Request #${requestId} has been completed successfully.`
        );
      }

      setTimeout(() => {
        fetchRequests();
      }, 300);
    } catch (err) {
      console.error(
        "Error updating request status:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update the service request status."
      );
    } finally {
      setUpdating(null);
    }
  };

  // ---------------------------------------
  // TIME FORM CHANGE
  // ---------------------------------------
  const handleTimeChange = (e) => {
    const { name, value } = e.target;

    setTimeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------
  // ADD TIME LOG
  // ---------------------------------------
  const addTimeLog = async (requestId) => {
    if (!timeForm.startTime) {
      setError("Please enter a start time.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const technicianId =
        user?.id || user?.userId;

      const payload = {
        requestId: requestId,
        technicianId: technicianId,
        startTime: timeForm.startTime,
        endTime: timeForm.endTime || null,
        description:
          timeForm.description.trim() ||
          "Service work performed",
      };

      await api.post(
        "/time-logs",
        payload
      );

      setSuccess(
        `Time log added for Request #${requestId}.`
      );

      setTimeForm({
        startTime: "",
        endTime: "",
        description: "",
      });

      await loadJobDetails(requestId);
    } catch (err) {
      console.error("Error adding time log:", err);

      setError(
        err.response?.data?.message ||
          "Unable to add time log."
      );
    }
  };

  // ---------------------------------------
  // DELETE TIME LOG
  // ---------------------------------------
  const deleteTimeLog = async (requestId, logId) => {
    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/time-logs/${logId}`
      );

      setSuccess("Time log deleted successfully.");

      await loadJobDetails(requestId);
    } catch (err) {
      console.error(
        "Error deleting time log:",
        err
      );

      setError("Unable to delete time log.");
    }
  };

  // ---------------------------------------
  // PART FORM CHANGE
  // ---------------------------------------
  const handlePartChange = (e) => {
    const { name, value } = e.target;

    setPartForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ---------------------------------------
  // ADD PART
  // ---------------------------------------
  const addPartUsage = async (requestId) => {
    if (!partForm.partName.trim()) {
      setError("Please enter the part name.");
      return;
    }

    if (
      !partForm.quantity ||
      Number(partForm.quantity) <= 0
    ) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (
      partForm.unitCost !== "" &&
      Number(partForm.unitCost) < 0
    ) {
      setError("Unit cost cannot be negative.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const technicianId =
        user?.id || user?.userId;

      const payload = {
        requestId: requestId,
        technicianId: technicianId,
        partName: partForm.partName.trim(),
        partNumber:
          partForm.partNumber.trim() || null,
        quantity: Number(partForm.quantity),
        unitCost:
          partForm.unitCost === ""
            ? 0
            : Number(partForm.unitCost),
        notes: partForm.notes.trim() || null,
      };

      await api.post(
        "/part-usages",
        payload
      );

      setSuccess(
        `Part added to Request #${requestId}.`
      );

      setPartForm({
        partName: "",
        partNumber: "",
        quantity: 1,
        unitCost: "",
        notes: "",
      });

      await loadJobDetails(requestId);
    } catch (err) {
      console.error("Error adding part:", err);

      setError(
        err.response?.data?.message ||
          "Unable to add part usage."
      );
    }
  };

  // ---------------------------------------
  // DELETE PART
  // ---------------------------------------
  const deletePartUsage = async (
    requestId,
    partId
  ) => {
    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/part-usages/${partId}`
      );

      setSuccess("Part usage deleted successfully.");

      await loadJobDetails(requestId);
    } catch (err) {
      console.error("Error deleting part:", err);

      setError("Unable to delete part usage.");
    }
  };

  // ---------------------------------------
  // TOTALS
  // ---------------------------------------
  const getTotalMinutes = (requestId) => {
    const logs = timeLogs[requestId] || [];

    return logs.reduce(
      (total, log) =>
        total + Number(log.durationMinutes || 0),
      0
    );
  };

  const getTotalPartCost = (requestId) => {
    const parts = partUsages[requestId] || [];

    return parts.reduce(
      (total, part) =>
        total +
        Number(part.quantity || 0) *
          Number(part.unitCost || 0),
      0
    );
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "0 min";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    }

    return `${hours}h ${mins}m`;
  };

  // ---------------------------------------
  // COUNTERS
  // ---------------------------------------
  const totalRequests = requests.length;

  const assignedCount = requests.filter(
    (request) => request.status === "ASSIGNED"
  ).length;

  const inProgressCount = requests.filter(
    (request) => request.status === "IN_PROGRESS"
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "COMPLETED"
  ).length;

  // ---------------------------------------
  // STATUS CLASS
  // ---------------------------------------
  const getStatusClass = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "status-assigned";

      case "IN_PROGRESS":
        return "status-progress";

      case "COMPLETED":
        return "status-completed";

      case "CANCELLED":
        return "status-cancelled";

      default:
        return "status-pending";
    }
  };

  // ---------------------------------------
  // PRIORITY CLASS
  // ---------------------------------------
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

  // ---------------------------------------
  // STATUS TEXT
  // ---------------------------------------
  const getStatusText = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "Assigned";

      case "IN_PROGRESS":
        return "In Progress";

      case "COMPLETED":
        return "Completed";

      case "CANCELLED":
        return "Cancelled";

      default:
        return "Pending";
    }
  };

  // ---------------------------------------
  // LOGOUT
  // ---------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ---------------------------------------
  // RENDER
  // ---------------------------------------
  return (
    <div className="technician-layout">

      {/* SIDEBAR */}
      <aside className="technician-sidebar">

        <div className="brand">
          <div className="brand-logo">K</div>

          <div>
            <h2>KEYSTONE</h2>
            <p>Field Service</p>
          </div>
        </div>

        <nav className="sidebar-nav">

          <button
            className="nav-item active"
            onClick={() =>
              navigate("/technician")
            }
          >
            🏠 Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/technician")
            }
          >
            📋 My Service Requests
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/technician")
            }
          >
            🔧 My Assignments
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/profile")
            }
          >
            👤 My Profile
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className="nav-item"
            onClick={() =>
              navigate("/settings")
            }
          >
            ⚙️ Settings
          </button>

          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="technician-main">

        {/* HEADER */}
        <div className="technician-header">

          <div>
            <p className="portal-label">
              TECHNICIAN PORTAL
            </p>

            <h1>
              Welcome back,{" "}
              {user?.name || "Technician"} 👋
            </h1>

            <p className="header-subtitle">
              Manage your assigned service requests
              and keep track of your work.
            </p>
          </div>

          <div className="technician-profile">

            <div className="profile-avatar">
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "T"}
            </div>

            <div>
              <strong>
                {user?.name || "Technician"}
              </strong>

              <span>
                {user?.email || ""}
              </span>
            </div>

          </div>

        </div>

        {/* SUCCESS */}
        {success && (
          <div className="success-message">
            ✅ {success}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon blue">📋</div>

            <div>
              <p>Total Assigned</p>

              <h2>
                {loading ? "..." : totalRequests}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">📌</div>

            <div>
              <p>Assigned</p>

              <h2>
                {loading ? "..." : assignedCount}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">🔧</div>

            <div>
              <p>In Progress</p>

              <h2>
                {loading
                  ? "..."
                  : inProgressCount}
              </h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>

            <div>
              <p>Completed</p>

              <h2>
                {loading
                  ? "..."
                  : completedCount}
              </h2>
            </div>
          </div>

        </div>

        {/* REQUESTS */}
        <section className="requests-section">

          <div className="section-header">

            <div>
              <h2>My Service Requests</h2>

              <p>
                Requests currently assigned to you.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              ↻ Refresh
            </button>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="empty-state">
              <div className="empty-icon">
                ⏳
              </div>

              <h3>Loading requests...</h3>

              <p>
                Please wait while we load your
                assigned requests.
              </p>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="empty-state">
              <div className="empty-icon">
                ⚠️
              </div>

              <h3>Unable to load requests</h3>

              <p>{error}</p>

              <button
                className="refresh-button"
                onClick={handleRefresh}
              >
                Try Again
              </button>
            </div>
          )}

          {/* NO REQUESTS */}
          {!loading &&
            !error &&
            requests.length === 0 && (
              <div className="empty-state">

                <div className="empty-icon">
                  📋
                </div>

                <h3>No requests assigned</h3>

                <p>
                  New service requests assigned to
                  you will appear here.
                </p>

              </div>
            )}

          {/* REQUEST LIST */}
          {!loading &&
            !error &&
            requests.length > 0 && (

              <div className="request-list">

                {requests.map((request) => {

                  const logs =
                    timeLogs[request.id] || [];

                  const parts =
                    partUsages[request.id] || [];

                  return (
                    <div
                      className="request-card"
                      key={request.id}
                    >

                      {/* REQUEST HEADER */}
                      <div className="request-top">

                        <div>
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
                          {getStatusText(
                            request.status
                          )}
                        </span>

                      </div>

                      {/* DETAILS */}
                      <div className="request-details">

                        <div>
                          <strong>Service</strong>

                          <span>
                            {request.serviceType ||
                              "Not specified"}
                          </span>
                        </div>

                        <div>
                          <strong>Priority</strong>

                          <span
                            className={`priority-badge ${getPriorityClass(
                              request.priority
                            )}`}
                          >
                            {request.priority ||
                              "MEDIUM"}
                          </span>
                        </div>

                        <div>
                          <strong>Location</strong>

                          <span>
                            {request.location ||
                              "Not specified"}
                          </span>
                        </div>

                      </div>

                      {/* DESCRIPTION */}
                      <div className="description">

                        <strong>Description</strong>

                        <p>
                          {request.description ||
                            "No description provided."}
                        </p>

                      </div>

                      {/* ACTIONS */}
                      <div className="request-actions">

                        {request.status ===
                          "ASSIGNED" && (

                          <button
                            className="start-button"
                            disabled={
                              updating === request.id
                            }
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "IN_PROGRESS"
                              )
                            }
                          >
                            {updating === request.id
                              ? "Starting..."
                              : "🔧 Start Work"}
                          </button>

                        )}

                        {request.status ===
                          "IN_PROGRESS" && (

                          <button
                            className="complete-button"
                            disabled={
                              updating === request.id
                            }
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "COMPLETED"
                              )
                            }
                          >
                            {updating === request.id
                              ? "Completing..."
                              : "✓ Mark Completed"}
                          </button>

                        )}

                        {request.status ===
                          "COMPLETED" && (

                          <div className="completed-message">
                            ✓ Service completed
                            successfully
                          </div>

                        )}

                        {request.status ===
                          "CANCELLED" && (

                          <div className="completed-message">
                            Service request cancelled
                          </div>

                        )}

                      </div>

                      {/* JOB DETAILS BUTTON */}
                      <div className="job-details-toggle">

                        <button
                          className="job-details-button"
                          onClick={() =>
                            toggleJobDetails(
                              request.id
                            )
                          }
                        >
                          {expandedRequest ===
                          request.id
                            ? "▲ Hide Job Details"
                            : "▼ Job Details"}
                        </button>

                      </div>

                      {/* JOB DETAILS */}
                      {expandedRequest ===
                        request.id && (

                        <div className="job-details-panel">

                          {loadingDetails ===
                            request.id ? (

                            <div className="details-loading">
                              ⏳ Loading job details...
                            </div>

                          ) : (

                            <>

                              {/* SUMMARY */}
                              <div className="job-summary">

                                <div>
                                  <span>
                                    ⏱️ Total Time
                                  </span>

                                  <strong>
                                    {formatDuration(
                                      getTotalMinutes(
                                        request.id
                                      )
                                    )}
                                  </strong>
                                </div>

                                <div>
                                  <span>
                                    🔧 Parts Used
                                  </span>

                                  <strong>
                                    {parts.length}
                                  </strong>
                                </div>

                                <div>
                                  <span>
                                    💰 Parts Cost
                                  </span>

                                  <strong>
                                    ₹
                                    {getTotalPartCost(
                                      request.id
                                    ).toFixed(2)}
                                  </strong>
                                </div>

                              </div>

                              {/* TIME LOG */}
                              <div className="job-section">

                                <div className="job-section-title">
                                  <div>
                                    <h4>
                                      ⏱️ Time Logs
                                    </h4>

                                    <p>
                                      Record time spent
                                      working on this
                                      request.
                                    </p>
                                  </div>
                                </div>

                                <div className="job-form">

                                  <div className="form-field">

                                    <label>
                                      Start Time
                                    </label>

                                    <input
                                      type="datetime-local"
                                      name="startTime"
                                      value={
                                        timeForm.startTime
                                      }
                                      onChange={
                                        handleTimeChange
                                      }
                                    />

                                  </div>

                                  <div className="form-field">

                                    <label>
                                      End Time
                                    </label>

                                    <input
                                      type="datetime-local"
                                      name="endTime"
                                      value={
                                        timeForm.endTime
                                      }
                                      onChange={
                                        handleTimeChange
                                      }
                                    />

                                  </div>

                                  <div className="form-field form-field-wide">

                                    <label>
                                      Work Description
                                    </label>

                                    <input
                                      type="text"
                                      name="description"
                                      placeholder="Example: Diagnosed compressor issue"
                                      value={
                                        timeForm.description
                                      }
                                      onChange={
                                        handleTimeChange
                                      }
                                    />

                                  </div>

                                  <button
                                    className="job-add-button"
                                    onClick={() =>
                                      addTimeLog(
                                        request.id
                                      )
                                    }
                                  >
                                    + Log Time
                                  </button>

                                </div>

                                {logs.length > 0 ? (

                                  <div className="records-list">

                                    {logs.map((log) => (

                                      <div
                                        className="record-row"
                                        key={log.id}
                                      >

                                        <div className="record-main">

                                          <strong>
                                            {log.description ||
                                              "Service work"}
                                          </strong>

                                          <span>
                                            {log.startTime
                                              ? new Date(
                                                  log.startTime
                                                ).toLocaleString()
                                              : "—"}
                                            {" → "}
                                            {log.endTime
                                              ? new Date(
                                                  log.endTime
                                                ).toLocaleString()
                                              : "Ongoing"}
                                          </span>

                                        </div>

                                        <div className="record-side">

                                          <strong>
                                            {formatDuration(
                                              Number(
                                                log.durationMinutes ||
                                                  0
                                              )
                                            )}
                                          </strong>

                                          <button
                                            className="delete-record-button"
                                            onClick={() =>
                                              deleteTimeLog(
                                                request.id,
                                                log.id
                                              )
                                            }
                                          >
                                            Delete
                                          </button>

                                        </div>

                                      </div>

                                    ))}

                                  </div>

                                ) : (

                                  <div className="no-records">
                                    No time logs recorded
                                    yet.
                                  </div>

                                )}

                              </div>

                              {/* PARTS */}
                              <div className="job-section">

                                <div className="job-section-title">
                                  <div>
                                    <h4>
                                      🔧 Parts Used
                                    </h4>

                                    <p>
                                      Record parts and
                                      materials used for
                                      this service.
                                    </p>
                                  </div>
                                </div>

                                <div className="job-form">

                                  <div className="form-field">

                                    <label>
                                      Part Name
                                    </label>

                                    <input
                                      type="text"
                                      name="partName"
                                      placeholder="Example: Capacitor"
                                      value={
                                        partForm.partName
                                      }
                                      onChange={
                                        handlePartChange
                                      }
                                    />

                                  </div>

                                  <div className="form-field">

                                    <label>
                                      Part Number
                                    </label>

                                    <input
                                      type="text"
                                      name="partNumber"
                                      placeholder="Example: CAP-440V"
                                      value={
                                        partForm.partNumber
                                      }
                                      onChange={
                                        handlePartChange
                                      }
                                    />

                                  </div>

                                  <div className="form-field">

                                    <label>
                                      Quantity
                                    </label>

                                    <input
                                      type="number"
                                      min="1"
                                      name="quantity"
                                      value={
                                        partForm.quantity
                                      }
                                      onChange={
                                        handlePartChange
                                      }
                                    />

                                  </div>

                                  <div className="form-field">

                                    <label>
                                      Unit Cost (₹)
                                    </label>

                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      name="unitCost"
                                      placeholder="0.00"
                                      value={
                                        partForm.unitCost
                                      }
                                      onChange={
                                        handlePartChange
                                      }
                                    />

                                  </div>

                                  <div className="form-field form-field-wide">

                                    <label>
                                      Notes
                                    </label>

                                    <input
                                      type="text"
                                      name="notes"
                                      placeholder="Optional notes"
                                      value={
                                        partForm.notes
                                      }
                                      onChange={
                                        handlePartChange
                                      }
                                    />

                                  </div>

                                  <button
                                    className="job-add-button part-button"
                                    onClick={() =>
                                      addPartUsage(
                                        request.id
                                      )
                                    }
                                  >
                                    + Add Part
                                  </button>

                                </div>

                                {parts.length > 0 ? (

                                  <div className="records-list">

                                    {parts.map((part) => {

                                      const total =
                                        Number(
                                          part.quantity || 0
                                        ) *
                                        Number(
                                          part.unitCost || 0
                                        );

                                      return (
                                        <div
                                          className="record-row"
                                          key={part.id}
                                        >

                                          <div className="record-main">

                                            <strong>
                                              {part.partName}
                                            </strong>

                                            <span>
                                              {part.partNumber ||
                                                "No part number"}
                                              {" • Qty: "}
                                              {part.quantity}
                                              {part.notes
                                                ? ` • ${part.notes}`
                                                : ""}
                                            </span>

                                          </div>

                                          <div className="record-side">

                                            <strong>
                                              ₹
                                              {total.toFixed(
                                                2
                                              )}
                                            </strong>

                                            <button
                                              className="delete-record-button"
                                              onClick={() =>
                                                deletePartUsage(
                                                  request.id,
                                                  part.id
                                                )
                                              }
                                            >
                                              Delete
                                            </button>

                                          </div>

                                        </div>
                                      );
                                    })}

                                  </div>

                                ) : (

                                  <div className="no-records">
                                    No parts recorded
                                    yet.
                                  </div>

                                )}

                              </div>

                            </>

                          )}

                        </div>

                      )}

                    </div>
                  );
                })}

              </div>

            )}

        </section>

      </main>

    </div>
  );
}

export default TechnicianDashboard;