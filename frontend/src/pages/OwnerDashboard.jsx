import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001/api";

function OwnerDashboard() {
  const [stores, setStores] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/owner/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setStores(response.data.stores);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard."
        );
      }
    };

    fetchDashboard();
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const sortedStores = [...stores].sort((first, second) => {
    let firstValue;
    let secondValue;

    if (sortBy === "rating") {
      firstValue = first.averageRating;
      secondValue = second.averageRating;
    } else {
      firstValue = first[sortBy] || "";
      secondValue = second[sortBy] || "";
    }

    if (typeof firstValue === "number") {
      return order === "asc"
        ? firstValue - secondValue
        : secondValue - firstValue;
    }

    return order === "asc"
      ? String(firstValue).localeCompare(String(secondValue))
      : String(secondValue).localeCompare(String(firstValue));
  });

  return (
    <div className="container-fluid px-4 py-3">
      {/* Navbar */}

      <nav className="navbar bg-white border rounded px-3 mb-4">
        <span className="navbar-brand fw-bold">
          Roxiler Store Rating
        </span>

        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">
            {user?.name}
          </span>

          <div className="d-flex align-items-center gap-3">
            <span className="text-muted">
              {user?.name}
            </span>

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => (window.location.href = "/change-password")}
            >
              Change Password
            </button>

            <button
              className="btn btn-outline-danger btn-sm"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}

      <div className="mb-4">
        <h2>Store Owner Dashboard</h2>

        <p className="text-muted">
          View your store performance and customer ratings.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Store Cards */}

      <div className="row g-3 mb-4">
        {stores.map((store) => (
          <div
            className="col-md-4"
            key={store.id}
          >
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title">
                  {store.name}
                </h5>

                <p className="text-muted mb-1">
                  {store.email}
                </p>

                <p className="text-muted">
                  {store.address || "-"}
                </p>

                <div className="d-flex gap-3 mt-3">
                  <div>
                    <small className="text-muted">
                      Average Rating
                    </small>

                    <h3 className="mb-0">
                      ★ {store.averageRating}
                    </h3>
                  </div>

                  <div>
                    <small className="text-muted">
                      Total Ratings
                    </small>

                    <h3 className="mb-0">
                      {store.totalRatings}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ratings */}

      <div className="card border-0 shadow-sm">
        <div className="card-body">

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">
                Customer Ratings
              </h5>

              <p className="text-muted mb-0">
                Users who submitted ratings for your store.
              </p>
            </div>

            <div className="d-flex gap-2">
              <select
                className="form-select"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="name">
                  Sort by Name
                </option>

                <option value="email">
                  Sort by Email
                </option>

                <option value="rating">
                  Sort by Rating
                </option>
              </select>

              <select
                className="form-select"
                value={order}
                onChange={(event) =>
                  setOrder(event.target.value)
                }
              >
                <option value="asc">
                  Ascending
                </option>

                <option value="desc">
                  Descending
                </option>
              </select>
            </div>
          </div>

          {sortedStores.map((store) => (
            <div
              key={store.id}
              className="table-responsive"
            >
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Rating</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {store.users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-5 text-muted"
                      >
                        No ratings yet.
                      </td>
                    </tr>
                  ) : (
                    store.users.map((rating) => (
                      <tr key={rating.id}>
                        <td className="fw-semibold">
                          {rating.name}
                        </td>

                        <td>
                          {rating.email}
                        </td>

                        <td>
                          <span className="badge text-bg-warning">
                            ★ {rating.rating}
                          </span>
                        </td>

                        <td>
                          {rating.created_at
                            ? new Date(
                                rating.created_at
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;