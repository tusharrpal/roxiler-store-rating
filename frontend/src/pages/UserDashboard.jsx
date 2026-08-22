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
  const [expandedRatings, setExpandedRatings] = useState({});

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const token = localStorage.getItem("token");

  /*
   * Load stores
   */
  useEffect(() => {
    let cancelled = false;

    const loadStores = async () => {
      if (!token) {
        if (!cancelled) {
          setError(
            "Authentication required. Please login again."
          );

          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);

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

        if (cancelled) {
          return;
        }

        const storeList = Array.isArray(
          response.data?.stores
        )
          ? response.data.stores
          : [];

        setStores(storeList);
        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load stores:",
          err
        );

        setStores([]);

        setError(
          err.response?.data?.message ||
            "Failed to load stores."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStores();

    return () => {
      cancelled = true;
    };
  }, [
    token,
    search,
    address,
    sortBy,
    order,
  ]);

  /*
   * Handle rating selection
   */
  const handleRatingChange = (
    storeId,
    value
  ) => {
    setRatingValues((currentRatings) => ({
      ...currentRatings,

      [storeId]:
        value === ""
          ? ""
          : Number(value),
    }));

    setMessage("");
    setError("");
  };

  /*
   * Expand / collapse recent ratings
   */
  const toggleRatings = (storeId) => {
    setExpandedRatings((current) => ({
      ...current,
      [storeId]: !current[storeId],
    }));
  };

  /*
   * Submit or update rating
   */
  const submitRating = async (storeId) => {
    const selectedRating =
      ratingValues[storeId];

    if (
      selectedRating === undefined ||
      selectedRating === "" ||
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setError(
        "Please select a rating between 1 and 5."
      );

      setMessage("");

      return;
    }

    if (!token) {
      setError(
        "Your session has expired. Please login again."
      );

      return;
    }

    try {
      setSubmittingId(storeId);

      setError("");
      setMessage("");

      await axios.post(
        `${API_URL}/user/stores/${storeId}/rating`,
        {
          rating: Number(selectedRating),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      /*
       * Reload stores so:
       * - Overall rating updates
       * - My rating updates
       * - Recent ratings updates
       */
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

      const updatedStores =
        Array.isArray(
          response.data?.stores
        )
          ? response.data.stores
          : [];

      setStores(updatedStores);

      setMessage(
        "Rating submitted successfully."
      );

      /*
       * Remove temporary selected rating
       * because the actual rating now comes
       * from the database.
       */
      setRatingValues(
        (currentRatings) => {
          const updatedRatings = {
            ...currentRatings,
          };

          delete updatedRatings[storeId];

          return updatedRatings;
        }
      );

      /*
       * Keep the ratings section open after
       * submitting/updating a rating.
       */
      setExpandedRatings((current) => ({
        ...current,
        [storeId]: true,
      }));
    } catch (err) {
      console.error(
        "Rating submission error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to submit rating."
      );

      setMessage("");
    } finally {
      setSubmittingId(null);
    }
  };

  /*
   * Logout
   */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <div className="container-fluid px-4 py-3">

      {/* =========================
          NAVBAR
      ========================== */}

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

      {/* =========================
          PAGE HEADER
      ========================== */}

      <div className="mb-4">

        <h2 className="mb-1">
          Store Ratings
        </h2>

        <p className="text-muted">
          Find stores and share your experience.
        </p>

      </div>

      {/* =========================
          MESSAGES
      ========================== */}

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

      {/* =========================
          FILTERS
      ========================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body">

          <div className="row g-3">

            {/* Store Name */}

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
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

            {/* Address */}

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
                  setAddress(
                    event.target.value
                  )
                }
              />

            </div>

            {/* Sort */}

            <div className="col-md-2">

              <label className="form-label">
                Sort By
              </label>

              <select
                className="form-select"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value
                  )
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

            {/* Order */}

            <div className="col-md-2">

              <label className="form-label">
                Order
              </label>

              <select
                className="form-select"
                value={order}
                onChange={(event) =>
                  setOrder(
                    event.target.value
                  )
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

      {/* =========================
          LOADING
      ========================== */}

      {loading && (
        <div className="card border-0 shadow-sm">

          <div className="card-body text-center py-5">

            <div
              className="spinner-border text-primary"
              role="status"
            >
              <span className="visually-hidden">
                Loading...
              </span>
            </div>

            <p className="text-muted mt-3 mb-0">
              Loading stores...
            </p>

          </div>

        </div>
      )}

      {/* =========================
          STORE LIST
      ========================== */}

      {!loading && (
        <div className="card border-0 shadow-sm">

          <div className="card-body">

            {stores.length === 0 ? (

              <div className="text-center py-5 text-muted">
                No stores found.
              </div>

            ) : (

              stores.map((store) => {

                const currentRating =
                  ratingValues[store.id] ??
                  store.user_rating ??
                  "";

                const hasRated =
                  Number(
                    store.user_rating
                  ) > 0;

                const isSubmitting =
                  submittingId ===
                  store.id;

                const recentRatings =
                  Array.isArray(
                    store.recent_ratings
                  )
                    ? store.recent_ratings
                    : [];

                const isExpanded =
                  Boolean(
                    expandedRatings[store.id]
                  );

                return (
                  <div
                    key={store.id}
                    className="border rounded p-4 mb-4"
                  >

                    {/* =====================
                        STORE INFORMATION
                    ====================== */}

                    <div className="row align-items-center">

                      {/* Store */}

                      <div className="col-md-5">

                        <h4 className="mb-1">
                          {store.name}
                        </h4>

                        <p className="text-muted mb-0">
                          {store.address ||
                            "-"}
                        </p>

                      </div>

                      {/* Overall Rating */}

                      <div className="col-md-2">

                        <small className="text-muted d-block">
                          Overall Rating
                        </small>

                        <span className="badge text-bg-warning fs-6">
                          ★{" "}
                          {store.overall_rating ??
                            "0.00"}
                        </span>

                      </div>

                      {/* My Rating */}

                      <div className="col-md-2">

                        <small className="text-muted d-block">
                          My Rating
                        </small>

                        {hasRated ? (

                          <span className="badge text-bg-primary fs-6">
                            ★{" "}
                            {store.user_rating}
                          </span>

                        ) : (

                          <span className="text-muted">
                            Not rated
                          </span>

                        )}

                      </div>

                      {/* Rating */}

                      <div className="col-md-3">

                        <div className="d-flex gap-2">

                          <select
                            className="form-select"
                            value={
                              currentRating
                            }
                            disabled={
                              isSubmitting
                            }
                            onChange={(
                              event
                            ) =>
                              handleRatingChange(
                                store.id,
                                event.target
                                  .value
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
                            type="button"
                            className="btn btn-primary"
                            disabled={
                              isSubmitting ||
                              currentRating ===
                                ""
                            }
                            onClick={() =>
                              submitRating(
                                store.id
                              )
                            }
                          >

                            {isSubmitting
                              ? "Saving..."
                              : hasRated
                              ? "Update"
                              : "Submit"}

                          </button>

                        </div>

                      </div>

                    </div>

                    {/* =====================
                        RECENT RATINGS
                    ====================== */}

                    <div className="mt-4 pt-3 border-top">

                      <button
                        type="button"
                        className="btn btn-link text-decoration-none text-dark w-100 p-0"
                        onClick={() =>
                          toggleRatings(
                            store.id
                          )
                        }
                      >

                        <div className="d-flex justify-content-between align-items-center">

                          <div className="text-start">

                            <h5 className="mb-1">
                              Recent Ratings
                            </h5>

                            <p className="text-muted mb-0">
                              Users who have rated
                              this store.
                            </p>

                          </div>

                          <div className="d-flex align-items-center gap-3">

                            <span className="badge text-bg-secondary">

                              {
                                recentRatings.length
                              }{" "}

                              {recentRatings.length ===
                              1
                                ? "Rating"
                                : "Ratings"}

                            </span>

                            <span
                              className="fs-5"
                              style={{
                                transition:
                                  "transform 0.2s ease",

                                transform:
                                  isExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                              }}
                            >
                              ▼
                            </span>

                          </div>

                        </div>

                      </button>

                      {/* ===================
                          EXPANDED RATINGS
                      ==================== */}

                      {isExpanded && (

                        <div className="mt-3">

                          {recentRatings.length ===
                          0 ? (

                            <div className="text-center py-3 text-muted border rounded">

                              No ratings submitted
                              yet.

                            </div>

                          ) : (

                            <div className="table-responsive">

                              <table className="table table-hover align-middle mb-0">

                                <thead className="table-light">

                                  <tr>

                                    <th>
                                      User
                                    </th>

                                    <th>
                                      Email
                                    </th>

                                    <th>
                                      Rating
                                    </th>

                                    <th>
                                      Date
                                    </th>

                                  </tr>

                                </thead>

                                <tbody>

                                  {recentRatings.map(
                                    (rating) => (

                                      <tr
                                        key={
                                          rating.id
                                        }
                                      >

                                        <td className="fw-semibold">
                                          {
                                            rating.name
                                          }
                                        </td>

                                        <td>
                                          {
                                            rating.email
                                          }
                                        </td>

                                        <td>

                                          <span className="badge text-bg-warning">
                                            ★{" "}
                                            {
                                              rating.rating
                                            }
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

                                    )
                                  )}

                                </tbody>

                              </table>

                            </div>

                          )}

                        </div>

                      )}

                    </div>

                  </div>
                );
              })

            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default UserDashboard;