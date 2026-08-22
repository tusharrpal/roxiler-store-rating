import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001/api";

function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState("");
  const [address, setAddress] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [ratingValues, setRatingValues] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/user/stores`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              name: search,
              address,
              sortBy,
              order,
            },
          }
        );

        setStores(response.data.stores);
        setError("");
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load stores."
        );
      }
    };

    fetchStores();
  }, [token, search, address, sortBy, order]);

  const handleRatingChange = (storeId, value) => {
    setRatingValues((currentRatings) => ({
      ...currentRatings,
      [storeId]: Number(value),
    }));
  };

  const submitRating = async (storeId) => {
    const rating = ratingValues[storeId];

    if (!rating || rating < 1 || rating > 5) {
      setError(
        "Please select a rating between 1 and 5."
      );
      return;
    }

    try {
      setError("");
      setMessage("");

      await axios.post(
        `${API_URL}/user/stores/${storeId}/rating`,
        {
          rating,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Rating submitted successfully.");

      const response = await axios.get(
        `${API_URL}/user/stores`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            name: search,
            address,
            sortBy,
            order,
          },
        }
      );

      setStores(response.data.stores);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit rating."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
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
      </nav>

      {/* Header */}

      <div className="mb-4">
        <h2 className="mb-1">
          Store Ratings
        </h2>

        <p className="text-muted">
          Find stores and share your experience.
        </p>
      </div>

      {/* Messages */}

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

      {/* Filters */}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">

          <div className="row g-3">

            <div className="col-md-4">
              <label className="form-label">
                Store Name
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Search stores..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Address
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Search address..."
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                Sort By
              </label>

              <select
                className="form-select"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="name">
                  Name
                </option>

                <option value="address">
                  Address
                </option>

                <option value="rating">
                  Rating
                </option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">
                Order
              </label>

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
        </div>
      </div>

      {/* Store Table */}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead className="table-light">
                <tr>
                  <th>Store Name</th>
                  <th>Address</th>
                  <th>Overall Rating</th>
                  <th>My Rating</th>
                  <th>Rate Store</th>
                </tr>
              </thead>

              <tbody>

                {stores.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-5 text-muted"
                    >
                      No stores found.
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => {

                    const currentRating =
                      ratingValues[store.id] ||
                      store.user_rating ||
                      "";

                    return (
                      <tr key={store.id}>

                        <td className="fw-semibold">
                          {store.name}
                        </td>

                        <td>
                          {store.address || "-"}
                        </td>

                        <td>
                          <span className="badge text-bg-warning">
                            ★ {store.overall_rating}
                          </span>
                        </td>

                        <td>
                          {Number(store.user_rating) > 0 ? (
                            <span className="badge text-bg-primary">
                              ★ {store.user_rating}
                            </span>
                          ) : (
                            <span className="text-muted">
                              Not rated
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="d-flex gap-2">

                            <select
                              className="form-select form-select-sm"
                              value={currentRating}
                              onChange={(event) =>
                                handleRatingChange(
                                  store.id,
                                  event.target.value
                                )
                              }
                            >
                              <option value="">
                                Select
                              </option>

                              <option value="1">
                                1 ★
                              </option>

                              <option value="2">
                                2 ★
                              </option>

                              <option value="3">
                                3 ★
                              </option>

                              <option value="4">
                                4 ★
                              </option>

                              <option value="5">
                                5 ★
                              </option>
                            </select>

                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() =>
                                submitRating(store.id)
                              }
                            >
                              {Number(store.user_rating) > 0
                                ? "Update"
                                : "Submit"}
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>
        </div>
      </div>

    </div>
  );
}

export default UserDashboard;