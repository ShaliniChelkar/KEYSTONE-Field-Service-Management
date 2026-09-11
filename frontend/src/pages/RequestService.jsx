import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./RequestService.css";

function RequestService() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    serviceType: "",
    title: "",
    description: "",
    location: "",
    priority: "MEDIUM",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8080/api/requests",
        {
          customerId: user?.userId || 1,
          serviceType: formData.serviceType,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          priority: formData.priority,
        }
      );

      console.log("Request created successfully:", response.data);

      setSuccess(
        `Service request #${response.data.id} created successfully!`
      );

      setFormData({
        serviceType: "",
        title: "",
        description: "",
        location: "",
        priority: "MEDIUM",
      });
    } catch (error) {
      console.error("Request error:", error);

      setError(
        "Unable to create service request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-page">

      <div className="request-header">
        <div>
          <p className="request-label">FIELD SERVICE</p>

          <h1>Request a Service</h1>

          <p>
            Tell us what you need and we'll connect you with the right
            technician.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/customer")}
        >
          ← Dashboard
        </button>
      </div>

      <div className="request-card">

        <div className="request-card-header">
          <div className="service-icon">🔧</div>

          <div>
            <h2>Service Details</h2>

            <p>
              Provide the details below so we can process your request.
            </p>
          </div>
        </div>

        {success && (
          <div className="success-message">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-grid">

            <div className="form-group">
              <label>Service Type</label>

              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
              >
                <option value="">Select a service</option>

                <option value="AC_REPAIR">
                  AC Repair
                </option>

                <option value="ELECTRICAL">
                  Electrical Service
                </option>

                <option value="PLUMBING">
                  Plumbing
                </option>

                <option value="APPLIANCE_REPAIR">
                  Appliance Repair
                </option>

                <option value="NETWORK">
                  Network / Internet
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

          </div>

          <div className="form-group">
            <label>Request Title</label>

            <input
              type="text"
              name="title"
              placeholder="Example: AC is not cooling"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>

            <input
              type="text"
              name="location"
              placeholder="Enter service location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              name="description"
              rows="6"
              placeholder="Describe the problem in detail..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/customer")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Request →"}
            </button>

          </div>

        </form>
      </div>

    </div>
  );
}

export default RequestService;