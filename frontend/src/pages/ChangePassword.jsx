import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001/api";

function ChangePassword() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      let endpoint = `${API_URL}/user/password`;

      if (user?.role === "STORE_OWNER") {
        endpoint = `${API_URL}/owner/password`;
      } else if (user?.role === "ADMIN") {
        endpoint = `${API_URL}/admin/password`;
      }

      const response = await axios.put(
        endpoint,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message ||
          "Password updated successfully."
      );

      setForm({
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Change Password</h2>

        <p className="text-muted">
          Update your account password.
        </p>

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Current Password */}

          <div className="mb-3">
            <label className="form-label">
              Current Password
            </label>

            <div className="input-group">
              <input
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                name="currentPassword"
                className="form-control"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
              />

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setShowCurrentPassword(
                    !showCurrentPassword
                  )
                }
              >
                {showCurrentPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* New Password */}

          <div className="mb-3">
            <label className="form-label">
              New Password
            </label>

            <div className="input-group">
              <input
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                name="newPassword"
                className="form-control"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
              />

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
              >
                {showNewPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Change Password"}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-link w-100 mt-2"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default ChangePassword;