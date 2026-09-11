import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API = "http://localhost:8080/api";

function getSlaStatus(request) {
  if (["COMPLETED", "CLOSED"].includes(request.status)) return "COMPLETED";
  if (!request.slaDueAt) return "NO SLA";

  return new Date() > new Date(request.slaDueAt)
    ? "OVERDUE"
    : "ON TRACK";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Audit History
  const [auditRequestId, setAuditRequestId] = useState("");
  const [auditHistory, setAuditHistory] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "ADMIN") {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [requestResponse, userResponse] = await Promise.all([
        axios.get(`${API}/requests`),
        axios.get(`${API}/users`),
      ]);

      setRequests(requestResponse.data || []);
      setUsers(userResponse.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = requests.filter(
      (request) =>
        !["COMPLETED", "CLOSED", "CANCELLED"].includes(request.status)
    );

    return {
      users: users.length,

      customers: users.filter((u) => u.role === "CUSTOMER").length,

      technicians: users.filter((u) => u.role === "TECHNICIAN").length,

      dispatchers: users.filter((u) => u.role === "DISPATCHER").length,

      admins: users.filter((u) => u.role === "ADMIN").length,

      requests: requests.length,

      active: active.length,

      completed: requests.filter(
        (r) => r.status === "COMPLETED"
      ).length,

      pending: requests.filter(
        (r) => r.status === "PENDING"
      ).length,

      inProgress: requests.filter(
        (r) => r.status === "IN_PROGRESS"
      ).length,

      overdue: requests.filter(
        (r) => getSlaStatus(r) === "OVERDUE"
      ).length,

      onTrack: requests.filter(
        (r) => getSlaStatus(r) === "ON TRACK"
      ).length,
    };
  }, [requests, users]);

  const statusData = useMemo(() => {
    const statuses = [
      ["PENDING", "Pending"],
      ["ASSIGNED", "Assigned"],
      ["IN_PROGRESS", "In Progress"],
      ["ON_HOLD", "On Hold"],
      ["COMPLETED", "Completed"],
      ["CANCELLED", "Cancelled"],
    ];

    return statuses.map(([key, label]) => {
      const count = requests.filter(
        (request) => request.status === key
      ).length;

      return {
        key,
        label,
        count,
        percent: requests.length
          ? Math.round((count / requests.length) * 100)
          : 0,
      };
    });
  }, [requests]);

  const priorityData = useMemo(() => {
    return ["HIGH", "MEDIUM", "LOW"].map((priority) => {
      const count = requests.filter(
        (request) => request.priority === priority
      ).length;

      return {
        priority,
        count,
        percent: requests.length
          ? Math.round((count / requests.length) * 100)
          : 0,
      };
    });
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const text = search.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesSearch =
        !text ||
        String(request.id).includes(text) ||
        request.title?.toLowerCase().includes(text) ||
        request.serviceType?.toLowerCase().includes(text) ||
        request.location?.toLowerCase().includes(text);

      const matchesStatus =
        statusFilter === "ALL" ||
        request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        roleFilter === "ALL" ||
        user.role === roleFilter
    );
  }, [users, roleFilter]);

  const technicians = users.filter(
    (user) =>
      user.role === "TECHNICIAN" &&
      user.active !== false
  );

  const workload = technicians.map((technician) => {
    const assigned = requests.filter(
      (request) =>
        Number(request.technicianId) === Number(technician.id) &&
        !["COMPLETED", "CLOSED", "CANCELLED"].includes(
          request.status
        )
    );

    return {
      ...technician,
      jobs: assigned.length,
      overdue: assigned.filter(
        (request) => getSlaStatus(request) === "OVERDUE"
      ).length,
    };
  });

  const loadAuditHistory = async (requestId) => {
    const selectedId =
      requestId !== undefined
        ? requestId
        : auditRequestId;

    if (!selectedId) {
      setAuditHistory([]);
      return;
    }

    try {
      setAuditLoading(true);

      const response = await axios.get(
        `${API}/status-history/request/${selectedId}`
      );

      setAuditHistory(response.data || []);
    } catch (err) {
      console.error(err);
      setAuditHistory([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleAuditRequestChange = (event) => {
    const value = event.target.value;

    setAuditRequestId(value);

    if (!value) {
      setAuditHistory([]);
      return;
    }

    loadAuditHistory(value);
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="admin-loading">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="admin-logo">K</div>

          <div>
            <h2>KEYSTONE</h2>
            <span>Management Portal</span>
          </div>
        </div>

        <nav className="admin-nav">

          <button
            className="active"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            📊 Dashboard
          </button>

          <button
            onClick={() =>
              document
                .getElementById("admin-analytics")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            📈 Analytics
          </button>

          <button
            onClick={() =>
              document
                .getElementById("admin-requests")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            📋 Requests
          </button>

          <button
            onClick={() =>
              document
                .getElementById("admin-users")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            👥 Users
          </button>

          <button
            onClick={() =>
              document
                .getElementById("admin-workload")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            👨‍🔧 Technicians
          </button>

          <button
            onClick={() =>
              document
                .getElementById("admin-audit")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            📜 Audit History
          </button>

          <button onClick={() => navigate("/profile")}>
            👤 My Profile
          </button>

          <button onClick={() => navigate("/settings")}>
            ⚙️ Settings
          </button>

        </nav>

        <button
          className="admin-logout"
          onClick={logout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* MAIN */}
      <main className="admin-main">

        {/* HEADER */}
        <header className="admin-header">

          <div>
            <span>ADMIN / MANAGER PORTAL</span>

            <h1>Management Dashboard</h1>

            <p>
              Monitor operations, users, work orders and
              service performance.
            </p>
          </div>

          <button
            className="admin-refresh"
            onClick={loadData}
          >
            ↻ Refresh
          </button>

        </header>

        {error && (
          <div className="admin-error">
            ⚠ {error}
          </div>
        )}

        {/* STATS */}
        <section className="admin-stats">

          <div className="admin-stat">
            <div className="stat-icon">👥</div>
            <strong>{stats.users}</strong>
            <span>Total Users</span>
          </div>

          <div className="admin-stat">
            <div className="stat-icon">📋</div>
            <strong>{stats.requests}</strong>
            <span>Total Requests</span>
          </div>

          <div className="admin-stat">
            <div className="stat-icon">🔧</div>
            <strong>{stats.active}</strong>
            <span>Active Jobs</span>
          </div>

          <div className="admin-stat">
            <div className="stat-icon">✅</div>
            <strong>{stats.completed}</strong>
            <span>Completed</span>
          </div>

          <div className="admin-stat admin-danger">
            <div className="stat-icon">🔴</div>
            <strong>{stats.overdue}</strong>
            <span>Overdue SLA</span>
          </div>

        </section>

        {/* USER OVERVIEW */}
        <section className="admin-overview">

          <div className="overview-box">
            <span>Customers</span>
            <strong>{stats.customers}</strong>
          </div>

          <div className="overview-box">
            <span>Technicians</span>
            <strong>{stats.technicians}</strong>
          </div>

          <div className="overview-box">
            <span>Dispatchers</span>
            <strong>{stats.dispatchers}</strong>
          </div>

          <div className="overview-box">
            <span>Active Work</span>
            <strong>{stats.active}</strong>
          </div>

        </section>

        {/* ANALYTICS */}
        <section
          className="admin-section"
          id="admin-analytics"
        >

          <div className="admin-section-heading">
            <div>
              <span>PERFORMANCE INSIGHTS</span>
              <h2>Service Analytics</h2>
            </div>

            <strong>Live dashboard</strong>
          </div>

          <div className="analytics-grid">

            {/* STATUS ANALYTICS */}
            <div className="analytics-card">

              <h3>Request Status</h3>

              <p className="analytics-subtitle">
                Current distribution of service requests
              </p>

              {statusData.map((item) => (
                <div
                  className="bar-row"
                  key={item.key}
                >

                  <div className="bar-label">
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>

                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${item.percent}%`,
                      }}
                    />
                  </div>

                </div>
              ))}

            </div>

            {/* PRIORITY */}
            <div className="analytics-card">

              <h3>Priority Distribution</h3>

              <p className="analytics-subtitle">
                Requests grouped by urgency
              </p>

              {priorityData.map((item) => (
                <div
                  className="priority-row"
                  key={item.priority}
                >

                  <div className="priority-info">

                    <span
                      className={`priority priority-${item.priority.toLowerCase()}`}
                    >
                      {item.priority}
                    </span>

                    <strong>{item.count}</strong>

                  </div>

                  <div className="bar-track">

                    <div
                      className={`bar-fill priority-fill-${item.priority.toLowerCase()}`}
                      style={{
                        width: `${item.percent}%`,
                      }}
                    />

                  </div>

                </div>
              ))}

            </div>

            {/* SLA */}
            <div className="analytics-card">

              <h3>SLA Performance</h3>

              <p className="analytics-subtitle">
                Service-level monitoring
              </p>

              <div className="sla-metrics">

                <div>
                  <strong>{stats.onTrack}</strong>
                  <span>On Track</span>
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

              <div className="sla-progress">

                <div
                  style={{
                    width: `${
                      stats.requests
                        ? Math.round(
                            ((stats.onTrack +
                              stats.completed) /
                              stats.requests) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />

              </div>

              <p className="sla-score">
                SLA Health:{" "}
                <strong>
                  {stats.requests
                    ? Math.round(
                        ((stats.onTrack +
                          stats.completed) /
                          stats.requests) *
                          100
                      )
                    : 0}
                  %
                </strong>
              </p>

            </div>

            {/* TECHNICIAN MINI WORKLOAD */}
            <div className="analytics-card">

              <h3>Technician Workload</h3>

              <p className="analytics-subtitle">
                Active workload by technician
              </p>

              {workload.length === 0 ? (
                <div className="analytics-empty">
                  No active technicians found.
                </div>
              ) : (
                workload.map((technician) => (
                  <div
                    className="mini-workload"
                    key={technician.id}
                  >

                    <div className="mini-avatar">
                      {technician.name
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <div className="mini-work-info">

                      <strong>
                        {technician.name}
                      </strong>

                      <div className="mini-bar">
                        <div
                          style={{
                            width: `${Math.min(
                              technician.jobs * 20,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                    </div>

                    <strong>
                      {technician.jobs}
                    </strong>

                  </div>
                ))
              )}

            </div>

          </div>

        </section>

        {/* REQUESTS */}
        <section
          className="admin-section"
          id="admin-requests"
        >

          <div className="admin-section-heading">

            <div>
              <span>OPERATIONS</span>
              <h2>Service Requests</h2>
            </div>

            <strong>
              {filteredRequests.length} requests
            </strong>

          </div>

          <div className="admin-filters">

            <input
              placeholder="🔎 Search requests..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
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

          </div>

          <div className="admin-table-wrap">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>Request</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Technician</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA</th>
                </tr>
              </thead>

              <tbody>

                {filteredRequests.length === 0 ? (

                  <tr>
                    <td
                      colSpan="7"
                      className="empty"
                    >
                      No requests found.
                    </td>
                  </tr>

                ) : (

                  filteredRequests.map((request) => {

                    const technician =
                      users.find(
                        (user) =>
                          Number(user.id) ===
                          Number(
                            request.technicianId
                          )
                      );

                    const sla =
                      getSlaStatus(request);

                    return (
                      <tr key={request.id}>

                        <td>
                          <strong>
                            #{request.id}
                          </strong>

                          <span className="request-title">
                            {request.title}
                          </span>
                        </td>

                        <td>
                          {request.serviceType}
                        </td>

                        <td>
                          #{request.customerId}
                        </td>

                        <td>
                          {technician
                            ? technician.name
                            : "Unassigned"}
                        </td>

                        <td>

                          <span
                            className={`priority priority-${request.priority?.toLowerCase()}`}
                          >
                            {request.priority}
                          </span>

                        </td>

                        <td>

                          <span className="status">
                            {request.status}
                          </span>

                        </td>

                        <td>

                          <span
                            className={`sla sla-${sla
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {sla}
                          </span>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* USERS */}
        <section
          className="admin-section"
          id="admin-users"
        >

          <div className="admin-section-heading">

            <div>
              <span>ACCESS MANAGEMENT</span>
              <h2>User Directory</h2>
            </div>

            <strong>
              {filteredUsers.length} users
            </strong>

          </div>

          <div className="admin-filters">

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
            >

              <option value="ALL">
                All Roles
              </option>

              <option value="CUSTOMER">
                Customers
              </option>

              <option value="TECHNICIAN">
                Technicians
              </option>

              <option value="DISPATCHER">
                Dispatchers
              </option>

              <option value="ADMIN">
                Administrators
              </option>

            </select>

          </div>

          <div className="user-grid">

            {filteredUsers.map((user) => (

              <div
                className="user-card"
                key={user.id}
              >

                <div className="user-avatar">
                  {user.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                <div className="user-info">

                  <h3>{user.name}</h3>

                  <p>{user.email}</p>

                  <span>{user.role}</span>

                </div>

                <div
                  className={
                    user.active === false
                      ? "inactive"
                      : "active-user"
                  }
                >
                  {user.active === false
                    ? "Inactive"
                    : "Active"}
                </div>

              </div>
            ))}

          </div>

        </section>

        {/* TECHNICIAN WORKLOAD */}
        <section
          className="admin-section"
          id="admin-workload"
        >

          <div className="admin-section-heading">

            <div>
              <span>RESOURCE UTILIZATION</span>
              <h2>Technician Workload</h2>
            </div>

          </div>

          <div className="workload-grid">

            {workload.length === 0 ? (

              <div className="analytics-empty">
                No technicians available.
              </div>

            ) : (

              workload.map((technician) => (

                <div
                  className="admin-workload-card"
                  key={technician.id}
                >

                  <div className="workload-avatar">
                    {technician.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <div className="workload-info">

                    <h3>{technician.name}</h3>

                    <p>{technician.email}</p>

                  </div>

                  <div className="workload-stat">

                    <strong>
                      {technician.jobs}
                    </strong>

                    <span>Active Jobs</span>

                  </div>

                  <div className="workload-stat overdue-number">

                    <strong>
                      {technician.overdue}
                    </strong>

                    <span>Overdue</span>

                  </div>

                </div>

              ))
            )}

          </div>

        </section>

        {/* AUDIT HISTORY */}
        <section
          className="admin-section"
          id="admin-audit"
        >

          <div className="admin-section-heading">

            <div>
              <span>ACCOUNTABILITY</span>
              <h2>Audit History</h2>
            </div>

            <strong>
              {auditHistory.length} changes
            </strong>

          </div>

          <div className="audit-toolbar">

            <select
              value={auditRequestId}
              onChange={handleAuditRequestChange}
            >

              <option value="">
                Select a service request
              </option>

              {requests.map((request) => (

                <option
                  key={request.id}
                  value={request.id}
                >
                  #{request.id} — {request.title}
                </option>

              ))}

            </select>

            <button
              className="audit-refresh"
              onClick={() =>
                loadAuditHistory()
              }
              disabled={
                !auditRequestId ||
                auditLoading
              }
            >
              {auditLoading
                ? "Loading..."
                : "↻ Refresh"}
            </button>

          </div>

          {!auditRequestId ? (

            <div className="analytics-empty">
              Select a service request to view
              its status change history.
            </div>

          ) : auditLoading ? (

            <div className="analytics-empty">
              Loading audit history...
            </div>

          ) : auditHistory.length === 0 ? (

            <div className="analytics-empty">
              No audit history found for this request.
            </div>

          ) : (

            <div className="audit-list">

              {auditHistory.map((item) => (

                <div
                  className="audit-item"
                  key={item.id}
                >

                  <div className="audit-dot">
                    ✓
                  </div>

                  <div className="audit-content">

                    <div className="audit-topline">

                      <strong>

                        {item.oldStatus || "NEW"}

                        <span className="audit-arrow">
                          →
                        </span>

                        {item.newStatus}

                      </strong>

                      <span className="audit-time">
                        {formatDate(
                          item.changedAt
                        )}
                      </span>

                    </div>

                    <div className="audit-meta">

                      <span>
                        User ID:{" "}
                        {item.changedByUserId ??
                          "—"}
                      </span>

                      <span>
                        Role:{" "}
                        {item.changedByRole ??
                          "—"}
                      </span>

                    </div>

                    {item.note && (
                      <p className="audit-note">
                        {item.note}
                      </p>
                    )}

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

        {/* FOOTER */}
        <footer className="admin-footer">

          KEYSTONE Field Service Management System

          <span>•</span>

          Administration & Analytics

        </footer>

      </main>

    </div>
  );
}