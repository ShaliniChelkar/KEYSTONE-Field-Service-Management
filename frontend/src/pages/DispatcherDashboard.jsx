import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./DispatcherDashboard.css";

const API = "http://localhost:8080/api";

function formatDate(date) {
  if (!date) return "Not scheduled";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSlaInfo(request) {
  if (!request.slaDueAt) {
    return {
      label: "NO SLA",
      className: "sla-none",
    };
  }

  const completed =
    request.status === "COMPLETED" ||
    request.status === "CLOSED";

  if (completed) {
    return {
      label: "COMPLETED",
      className: "sla-completed",
    };
  }

  const now = new Date();
  const due = new Date(request.slaDueAt);

  if (now > due) {
    return {
      label: "OVERDUE",
      className: "sla-overdue",
    };
  }

  const hours =
    (due.getTime() - now.getTime()) /
    (1000 * 60 * 60);

  if (hours <= 4) {
    return {
      label: "DUE SOON",
      className: "sla-warning",
    };
  }

  return {
    label: "ON TRACK",
    className: "sla-track",
  };
}

export default function DispatcherDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [slaFilter, setSlaFilter] = useState("ALL");

  const [selectedTechnicians, setSelectedTechnicians] = useState({});
  const [scheduleValues, setScheduleValues] = useState({});
  const [slaValues, setSlaValues] = useState({});

  const [viewRequest, setViewRequest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "DISPATCHER") {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [requestsResponse, usersResponse] =
        await Promise.all([
          axios.get(`${API}/requests`),
          axios.get(`${API}/users`),
        ]);

      setRequests(requestsResponse.data || []);
      setUsers(usersResponse.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load dispatcher data.");
    } finally {
      setLoading(false);
    }
  };

  const technicians = useMemo(
    () =>
      users.filter(
        (user) =>
          user.role === "TECHNICIAN" &&
          user.active !== false
      ),
    [users]
  );

  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let onTrack = 0;
    let completed = 0;

    requests.forEach((request) => {
      const sla = getSlaInfo(request);

      if (sla.label === "OVERDUE") overdue++;
      else if (sla.label === "DUE SOON") dueSoon++;
      else if (sla.label === "ON TRACK") onTrack++;
      else if (sla.label === "COMPLETED") completed++;
    });

    return {
      total: requests.length,

      pending: requests.filter(
        (r) => r.status === "PENDING"
      ).length,

      assigned: requests.filter(
        (r) => r.status === "ASSIGNED"
      ).length,

      inProgress: requests.filter(
        (r) => r.status === "IN_PROGRESS"
      ).length,

      completed,
      overdue,
      dueSoon,
      onTrack,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const text = search.toLowerCase();

      const matchesSearch =
        !text ||
        String(request.id).includes(text) ||
        request.title?.toLowerCase().includes(text) ||
        request.serviceType?.toLowerCase().includes(text) ||
        request.location?.toLowerCase().includes(text) ||
        request.description?.toLowerCase().includes(text) ||
        String(request.customerId).includes(text);

      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" ||
        request.priority === priorityFilter;

      const sla = getSlaInfo(request);

      const matchesSla =
        slaFilter === "ALL" ||
        sla.label === slaFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesSla
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    priorityFilter,
    slaFilter,
  ]);

  const handleAssign = async (requestId) => {
    const technicianId =
      selectedTechnicians[requestId];

    if (!technicianId) {
      setError("Please select a technician first.");
      return;
    }

    try {
      setError("");
      setMessage("");

      const user = JSON.parse(
        localStorage.getItem("user")
      );

      await axios.put(
        `${API}/requests/${requestId}/assign/${technicianId}`,
        {},
        {
          headers: {
            "X-User-Id": user?.id,
            "X-User-Role": user?.role,
          },
        }
      );

      setMessage(
        `Technician assigned successfully to Request #${requestId}.`
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to assign technician.");
    }
  };

  const handleStatusChange = async (
    requestId,
    newStatus
  ) => {
    try {
      setError("");
      setMessage("");

      const user = JSON.parse(
        localStorage.getItem("user")
      );

      await axios.put(
        `${API}/requests/${requestId}/status/${newStatus}`,
        {},
        {
          headers: {
            "X-User-Id": user?.id,
            "X-User-Role": user?.role,
          },
        }
      );

      setMessage(
        `Request #${requestId} status updated.`
      );

      await loadData();

      if (
        viewRequest &&
        Number(viewRequest.id) === Number(requestId)
      ) {
        const updatedRequest =
          await axios.get(
            `${API}/requests/${requestId}`
          );

        setViewRequest(updatedRequest.data);
      }
    } catch (err) {
      console.error(err);

      const backendMessage =
        err.response?.data;

      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "Failed to update status."
      );
    }
  };

  const handleSchedule = async (requestId) => {
    const value = scheduleValues[requestId];

    if (!value) {
      setError(
        "Please select a schedule date and time."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      await axios.put(
        `${API}/requests/${requestId}/schedule`,
        {
          scheduledAt: value,
        }
      );

      setMessage(
        `Request #${requestId} scheduled successfully.`
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to schedule request.");
    }
  };

  const handleSlaUpdate = async (requestId) => {
    const value = slaValues[requestId];

    if (!value) {
      setError(
        "Please select an SLA due date and time."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      await axios.put(
        `${API}/requests/${requestId}/sla`,
        {
          slaDueAt: value,
        }
      );

      setMessage(
        `SLA updated for Request #${requestId}.`
      );

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to update SLA.");
    }
  };

  const workload = useMemo(() => {
    return technicians.map((technician) => {
      const assigned = requests.filter(
        (request) =>
          Number(request.technicianId) ===
            Number(technician.id) &&
          request.status !== "COMPLETED" &&
          request.status !== "CLOSED" &&
          request.status !== "CANCELLED"
      );

      const overdue = assigned.filter(
        (request) =>
          getSlaInfo(request).label === "OVERDUE"
      );

      return {
        ...technician,
        assignedCount: assigned.length,
        overdueCount: overdue.length,
      };
    });
  }, [technicians, requests]);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getTechnicianName = (technicianId) => {
    if (!technicianId) {
      return "Not assigned";
    }

    return (
      technicians.find(
        (technician) =>
          Number(technician.id) ===
          Number(technicianId)
      )?.name || "Assigned technician"
    );
  };

  const openRequestDetails = (request) => {
    setViewRequest(request);
  };

  const closeRequestDetails = () => {
    setViewRequest(null);
  };

  if (loading) {
    return (
      <div className="dispatcher-loading">
        Loading Dispatcher Dashboard...
      </div>
    );
  }

  return (
    <div className="dispatcher-layout">

      {/* SIDEBAR */}
      <aside className="dispatcher-sidebar">

        <div className="dispatcher-brand">
          <div className="dispatcher-logo">
            K
          </div>

          <div>
            <h2>KEYSTONE</h2>
            <span>Field Service</span>
          </div>
        </div>

        <nav className="dispatcher-nav">

          <button className="active">
            <span>📊</span>
            Dashboard
          </button>

          <button
            onClick={() =>
              document
                .getElementById("dispatch-board")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span>🚚</span>
            Dispatch Board
          </button>

          <button
            onClick={() =>
              document
                .getElementById("technician-workload")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <span>👨‍🔧</span>
            Technicians
          </button>

          <button
            onClick={() => navigate("/profile")}
          >
            <span>👤</span>
            My Profile
          </button>

          <button
            onClick={() => navigate("/settings")}
          >
            <span>⚙️</span>
            Settings
          </button>

        </nav>

        <button
          className="dispatcher-logout"
          onClick={logout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* MAIN */}
      <main className="dispatcher-main">

        <header className="dispatcher-header">

          <div>
            <span className="dispatcher-eyebrow">
              DISPATCHER PORTAL
            </span>

            <h1>Dispatch Operations</h1>

            <p>
              Manage work orders, technicians,
              schedules and SLA performance.
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={loadData}
          >
            ↻ Refresh
          </button>

        </header>

        {message && (
          <div className="dispatcher-message">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="dispatcher-error">
            ⚠ {error}
          </div>
        )}

        {/* STATS */}
        <section className="dispatcher-stats">

          <div className="dispatcher-stat">
            <span>📋</span>
            <div>
              <strong>{stats.total}</strong>
              <small>Total Requests</small>
            </div>
          </div>

          <div className="dispatcher-stat">
            <span>⏳</span>
            <div>
              <strong>{stats.pending}</strong>
              <small>Pending</small>
            </div>
          </div>

          <div className="dispatcher-stat">
            <span>🔧</span>
            <div>
              <strong>{stats.inProgress}</strong>
              <small>In Progress</small>
            </div>
          </div>

          <div className="dispatcher-stat sla-stat-danger">
            <span>🔴</span>
            <div>
              <strong>{stats.overdue}</strong>
              <small>Overdue</small>
            </div>
          </div>

          <div className="dispatcher-stat sla-stat-warning">
            <span>🟠</span>
            <div>
              <strong>{stats.dueSoon}</strong>
              <small>Due Soon</small>
            </div>
          </div>

          <div className="dispatcher-stat sla-stat-success">
            <span>🟢</span>
            <div>
              <strong>{stats.onTrack}</strong>
              <small>On Track</small>
            </div>
          </div>

        </section>

        {/* SLA SUMMARY */}
        <section className="sla-overview">

          <div>
            <h2>SLA Performance</h2>

            <p>
              Monitor service-level deadlines across
              active work orders.
            </p>
          </div>

          <div className="sla-overview-items">

            <div>
              <strong>{stats.onTrack}</strong>
              <span>On Track</span>
            </div>

            <div>
              <strong>{stats.dueSoon}</strong>
              <span>Due Soon</span>
            </div>

            <div>
              <strong>{stats.overdue}</strong>
              <span>Overdue</span>
            </div>

            <div>
              <strong>{stats.completed}</strong>
              <span>Completed</span>
            </div>

          </div>

        </section>

        {/* DISPATCH BOARD */}
        <section
          className="dispatch-section"
          id="dispatch-board"
        >

          <div className="section-heading">

            <div>
              <span>WORK ORDER MANAGEMENT</span>
              <h2>Dispatch Board</h2>
            </div>

            <strong>
              {filteredRequests.length} requests
            </strong>

          </div>

          {/* FILTERS */}
          <div className="dispatcher-filters">

            <input
              type="text"
              placeholder="🔎 Search request, location, service..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="ASSIGNED">
                Assigned
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="ON_HOLD">
                On Hold
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Priorities
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="LOW">
                Low
              </option>
            </select>

            <select
              value={slaFilter}
              onChange={(e) =>
                setSlaFilter(e.target.value)
              }
            >
              <option value="ALL">
                All SLA
              </option>

              <option value="OVERDUE">
                Overdue
              </option>

              <option value="DUE SOON">
                Due Soon
              </option>

              <option value="ON TRACK">
                On Track
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>

          </div>

          <div className="dispatch-table-wrapper">

            <table className="dispatch-table">

              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Schedule</th>
                  <th>SLA</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredRequests.length === 0 ? (

                  <tr>
                    <td
                      colSpan="10"
                      className="empty-row"
                    >
                      No requests found.
                    </td>
                  </tr>

                ) : (

                  filteredRequests.map((request) => {

                    const sla =
                      getSlaInfo(request);

                    return (
                      <tr key={request.id}>

                        <td>
                          <div className="request-cell">
                            <strong>
                              #{request.id}
                            </strong>

                            <span>
                              {request.title}
                            </span>
                          </div>
                        </td>

                        <td>
                          Customer #{request.customerId}
                        </td>

                        <td>
                          {request.serviceType}
                        </td>

                        <td>
                          {request.location}
                        </td>

                        <td>
                          <span
                            className={`priority-badge priority-${request.priority?.toLowerCase()}`}
                          >
                            {request.priority}
                          </span>
                        </td>

                        <td>
                          <select
                            className="status-select"
                            value={request.status}
                            onChange={(e) =>
                              handleStatusChange(
                                request.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="PENDING">
                              Pending
                            </option>

                            <option value="ASSIGNED">
                              Assigned
                            </option>

                            <option value="IN_PROGRESS">
                              In Progress
                            </option>

                            <option value="ON_HOLD">
                              On Hold
                            </option>

                            <option value="COMPLETED">
                              Completed
                            </option>

                            <option value="CANCELLED">
                              Cancelled
                            </option>

                            <option value="CLOSED">
                              Closed
                            </option>
                          </select>
                        </td>

                        <td>
                          <div className="assignment-cell">

                            <select
                              value={
                                selectedTechnicians[
                                  request.id
                                ] ??
                                request.technicianId ??
                                ""
                              }
                              onChange={(e) =>
                                setSelectedTechnicians(
                                  (prev) => ({
                                    ...prev,
                                    [request.id]:
                                      e.target.value,
                                  })
                                )
                              }
                            >
                              <option value="">
                                Select technician
                              </option>

                              {technicians.map(
                                (technician) => (
                                  <option
                                    key={technician.id}
                                    value={technician.id}
                                  >
                                    {technician.name}
                                  </option>
                                )
                              )}
                            </select>

                            <button
                              className="assign-btn"
                              onClick={() =>
                                handleAssign(
                                  request.id
                                )
                              }
                            >
                              Assign
                            </button>

                          </div>
                        </td>

                        <td>
                          <div className="schedule-cell">

                            <small>
                              {formatDate(
                                request.scheduledAt
                              )}
                            </small>

                            <input
                              type="datetime-local"
                              value={
                                scheduleValues[
                                  request.id
                                ] || ""
                              }
                              onChange={(e) =>
                                setScheduleValues(
                                  (prev) => ({
                                    ...prev,
                                    [request.id]:
                                      e.target.value,
                                  })
                                )
                              }
                            />

                            <button
                              className="schedule-btn"
                              onClick={() =>
                                handleSchedule(
                                  request.id
                                )
                              }
                            >
                              Schedule
                            </button>

                          </div>
                        </td>

                        <td>
                          <div className="sla-cell">

                            <span
                              className={`sla-badge ${sla.className}`}
                            >
                              {sla.label}
                            </span>

                            {request.slaDueAt && (
                              <small>
                                Due{" "}
                                {formatDate(
                                  request.slaDueAt
                                )}
                              </small>
                            )}

                            <input
                              type="datetime-local"
                              value={
                                slaValues[
                                  request.id
                                ] || ""
                              }
                              onChange={(e) =>
                                setSlaValues(
                                  (prev) => ({
                                    ...prev,
                                    [request.id]:
                                      e.target.value,
                                  })
                                )
                              }
                            />

                            <button
                              className="sla-btn"
                              onClick={() =>
                                handleSlaUpdate(
                                  request.id
                                )
                              }
                            >
                              Set SLA
                            </button>

                          </div>
                        </td>

                        <td>
                          <button
                            className="view-btn"
                            onClick={() =>
                              openRequestDetails(request)
                            }
                          >
                            View
                          </button>
                        </td>

                      </tr>
                    );
                  })

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* TECHNICIAN WORKLOAD */}
        <section
          className="workload-section"
          id="technician-workload"
        >

          <div className="section-heading">

            <div>
              <span>RESOURCE MANAGEMENT</span>
              <h2>Technician Workload</h2>
            </div>

          </div>

          <div className="workload-grid">

            {workload.length === 0 ? (

              <div className="empty-workload">
                No active technicians found.
              </div>

            ) : (

              workload.map((technician) => (

                <div
                  className="workload-card"
                  key={technician.id}
                >

                  <div className="technician-avatar">
                    {technician.name
                      ?.charAt(0)
                      ?.toUpperCase() || "T"}
                  </div>

                  <div className="technician-info">

                    <h3>
                      {technician.name}
                    </h3>

                    <p>
                      {technician.email}
                    </p>

                  </div>

                  <div className="workload-numbers">

                    <div>
                      <strong>
                        {technician.assignedCount}
                      </strong>

                      <span>
                        Active Jobs
                      </span>
                    </div>

                    <div className="workload-overdue">

                      <strong>
                        {technician.overdueCount}
                      </strong>

                      <span>
                        Overdue
                      </span>

                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

        <footer className="dispatcher-footer">
          KEYSTONE Field Service Management System
          <span>•</span>
          Dispatcher Operations
        </footer>

      </main>

      {/* REQUEST DETAILS MODAL */}
      {viewRequest && (
        <div
          className="request-modal-overlay"
          onClick={closeRequestDetails}
        >
          <div
            className="request-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="request-modal-header">

              <div>
                <span>
                  WORK ORDER DETAILS
                </span>

                <h2>
                  Request #{viewRequest.id}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeRequestDetails}
              >
                ×
              </button>

            </div>

            <div className="request-modal-grid">

              <div className="detail-item">
                <span>Title</span>

                <strong>
                  {viewRequest.title || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>Service Type</span>

                <strong>
                  {viewRequest.serviceType || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>Customer</span>

                <strong>
                  Customer #{viewRequest.customerId}
                </strong>
              </div>

              <div className="detail-item">
                <span>Technician</span>

                <strong>
                  {getTechnicianName(
                    viewRequest.technicianId
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>Location</span>

                <strong>
                  {viewRequest.location || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>Priority</span>

                <strong>
                  {viewRequest.priority || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>Status</span>

                <strong>
                  {viewRequest.status || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>Scheduled</span>

                <strong>
                  {formatDate(
                    viewRequest.scheduledAt
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>SLA Due</span>

                <strong>
                  {formatDate(
                    viewRequest.slaDueAt
                  )}
                </strong>
              </div>

              <div className="detail-item">
                <span>Created</span>

                <strong>
                  {formatDate(
                    viewRequest.createdAt
                  )}
                </strong>
              </div>

              <div className="detail-item detail-full">

                <span>
                  Description
                </span>

                <p>
                  {viewRequest.description ||
                    "No description provided."}
                </p>

              </div>

              <div className="detail-item detail-full">

                <span>
                  Technician Notes
                </span>

                <p>
                  {viewRequest.technicianNotes ||
                    "No technician notes yet."}
                </p>

              </div>

              <div className="detail-item detail-full">

                <span>
                  Completion Notes
                </span>

                <p>
                  {viewRequest.completionNotes ||
                    "No completion notes yet."}
                </p>

              </div>

            </div>

            <div className="request-modal-footer">

              <span
                className={`sla-badge ${
                  getSlaInfo(viewRequest).className
                }`}
              >
                {getSlaInfo(viewRequest).label}
              </span>

              <button
                className="modal-done-btn"
                onClick={closeRequestDetails}
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}