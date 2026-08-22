import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001/api";

function OwnerDashboard() {
  const [stores, setStores] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const response = await axios.get(
          `${API_URL}/owner/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const dashboardStores = Array.isArray(
          response.data?.stores
        )
          ? response.data.stores
          : [];

        setStores(dashboardStores);
      } catch (err) {
        console.error("Owner dashboard error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  /*
   * Convert all users from all stores into one list.
   *
   * Expected backend format:
   *
   * stores: [
   *   {
   *     id,
   *     name,
   *     averageRating,
   *     totalRatings,
   *     users: [
   *       {
   *         id,
   *         name,
   *         email,
   *         rating,
   *         created_at
   *       }
   *     ]
   *   }
   * ]
   */
  const customerRatings = useMemo(() => {
    const ratings = [];

    stores.forEach((store) => {
      if (!Array.isArray(store.users)) {
        return;
      }

      store.users.forEach((rating) => {
        ratings.push({
          ...rating,
          storeName: store.name,
        });
      });
    });

    return ratings;
  }, [stores]);

  const sortedCustomerRatings = useMemo(() => {
    const ratings = [...customerRatings];

    ratings.sort((first, second) => {
      let firstValue;
      let secondValue;

      if (sortBy === "rating") {
        firstValue = Number(first.rating) || 0;
        secondValue = Number(second.rating) || 0;

        return order === "asc"
          ? firstValue - secondValue
          : secondValue - firstValue;
      }

      if (sortBy === "date") {
        firstValue = first.created_at
          ? new Date(first.created_at).getTime()
          : 0;

        secondValue = second.created_at
          ? new Date(second.created_at).getTime()
          : 0;

        return order === "asc"
          ? firstValue - secondValue
          : secondValue - firstValue;
      }

      firstValue = String(
        first[sortBy] || ""
      ).toLowerCase();

      secondValue = String(
        second[sortBy] || ""
      ).toLowerCase();

      return order === "asc"
        ? firstValue.localeCompare(secondValue)
        : secondValue.localeCompare(firstValue);
    });

    return ratings;
  }, [customerRatings, sortBy, order]);

  const formatRating = (rating) => {
    const value = Number(rating);

    if (Number.isNaN(value)) {
      return "0.00";
    }

    return value.toFixed(2);
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString();
  };

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

          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() =>
              (window.location.href =
                "/change-password")
            }
          >
            Change Password
          </button>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Header */}

      <div className="mb-4">
        <h2>Store Owner Dashboard</h2>

        <p className="text-muted">
          View your store performance and customer
          ratings.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Loading */}

      {loading && (
        <div className="text-center py-5">
          <div
            className="spinner-border text-primary"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="text-muted mt-2">
            Loading dashboard...
          </p>
        </div>
      )}

      {/* Store Cards */}

      {!loading && stores.length > 0 && (
        <div className="row g-3 mb-4">
          {stores.map((store) => (
            <div
              className="col-md-6 col-lg-4"
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

                  <p className="text-muted mb-0">
                    {store.address || "-"}
                  </p>

                  <hr />

                  <div className="row text-center">
                    <div className="col-6">
                      <small className="text-muted d-block">
                        Average Rating
                      </small>

                      <h3 className="mb-0 mt-1">
                        ★{" "}
                        {formatRating(
                          store.averageRating
                        )}
                      </h3>
                    </div>

                    <div className="col-6">
                      <small className="text-muted d-block">
                        Total Ratings
                      </small>

                      <h3 className="mb-0 mt-1">
                        {store.totalRatings || 0}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Store */}

      {!loading && stores.length === 0 && !error && (
        <div className="alert alert-info">
          No store is currently assigned to your
          account.
        </div>
      )}

      {/* Customer Ratings */}

      {!loading && stores.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
              <div>
                <h5 className="mb-1">
                  Customer Ratings
                </h5>

                <p className="text-muted mb-0">
                  Users who submitted ratings for your
                  store.
                </p>
              </div>

              {/* Sorting */}

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

                  <option value="date">
                    Sort by Date
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

            {/* Rating Count */}

            <div className="mb-3">
              <span className="badge text-bg-primary">
                {customerRatings.length}{" "}
                {customerRatings.length === 1
                  ? "Rating"
                  : "Ratings"}
              </span>
            </div>

            {/* Ratings Table */}

            {sortedCustomerRatings.length === 0 ? (
              <div className="text-center py-5">
                <div
                  className="fs-1 mb-2"
                  aria-hidden="true"
                >
                  ★
                </div>

                <h5>No ratings yet</h5>

                <p className="text-muted mb-0">
                  Users who rate your store will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Store</th>
                      <th>Rating</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedCustomerRatings.map(
                      (rating, index) => (
                        <tr
                          key={
                            rating.id ||
                            `${rating.email}-${rating.storeName}-${index}`
                          }
                        >
                          <td className="fw-semibold">
                            {rating.name || "-"}
                          </td>

                          <td>
                            {rating.email || "-"}
                          </td>

                          <td>
                            {rating.storeName || "-"}
                          </td>

                          <td>
                            <span className="badge text-bg-warning">
                              ★{" "}
                              {formatRating(
                                rating.rating
                              )}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              rating.created_at
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;