import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5001/api";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0,
  });

  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");

  const [userSort, setUserSort] = useState("name");
  const [userOrder, setUserOrder] = useState("asc");

  const [storeSort, setStoreSort] = useState("name");
  const [storeOrder, setStoreOrder] = useState("asc");

  const [activeTab, setActiveTab] = useState("users");
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStats(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load dashboard."
        );
      }
    };

    fetchDashboard();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            name: userSearch,
            sortBy: userSort,
            order: userOrder,
          },
        });

        setUsers(response.data.users);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load users."
        );
      }
    };

    fetchUsers();
  }, [token, userSearch, userSort, userOrder]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/stores`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            name: storeSearch,
            sortBy: storeSort,
            order: storeOrder,
          },
        });

        setStores(response.data.stores);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load stores."
        );
      }
    };

    fetchStores();
  }, [token, storeSearch, storeSort, storeOrder]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="container-fluid px-4 py-3">
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

      <div className="mb-4">
        <h2>Admin Dashboard</h2>
        <p className="text-muted">
          Manage users, stores and ratings.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Statistics */}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total Users
              </p>
              <h2 className="mb-0">
                {stats.totalUsers}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total Stores
              </p>
              <h2 className="mb-0">
                {stats.totalStores}
              </h2>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-muted mb-1">
                Total Ratings
              </p>
              <h2 className="mb-0">
                {stats.totalRatings}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "users" ? "active" : ""
                }`}
                onClick={() => setActiveTab("users")}
              >
                Users
              </button>
            </li>

            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "stores" ? "active" : ""
                }`}
                onClick={() => setActiveTab("stores")}
              >
                Stores
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">

          {/* USERS */}

          {activeTab === "users" && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search users by name..."
                    value={userSearch}
                    onChange={(event) =>
                      setUserSearch(event.target.value)
                    }
                  />
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={userSort}
                    onChange={(event) =>
                      setUserSort(event.target.value)
                    }
                  >
                    <option value="name">
                      Sort by Name
                    </option>

                    <option value="email">
                      Sort by Email
                    </option>

                    <option value="address">
                      Sort by Address
                    </option>

                    <option value="role">
                      Sort by Role
                    </option>
                  </select>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={userOrder}
                    onChange={(event) =>
                      setUserOrder(event.target.value)
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

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Role</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-4 text-muted"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-semibold">
                            {item.name}
                          </td>

                          <td>{item.email}</td>

                          <td>
                            {item.address || "-"}
                          </td>

                          <td>
                            <span className="badge text-bg-secondary">
                              {item.role}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* STORES */}

          {activeTab === "stores" && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search stores by name..."
                    value={storeSearch}
                    onChange={(event) =>
                      setStoreSearch(event.target.value)
                    }
                  />
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={storeSort}
                    onChange={(event) =>
                      setStoreSort(event.target.value)
                    }
                  >
                    <option value="name">
                      Sort by Name
                    </option>

                    <option value="email">
                      Sort by Email
                    </option>

                    <option value="address">
                      Sort by Address
                    </option>

                    <option value="rating">
                      Sort by Rating
                    </option>
                  </select>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={storeOrder}
                    onChange={(event) =>
                      setStoreOrder(event.target.value)
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

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Store Name</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Rating</th>
                    </tr>
                  </thead>

                  <tbody>
                    {stores.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-4 text-muted"
                        >
                          No stores found.
                        </td>
                      </tr>
                    ) : (
                      stores.map((store) => (
                        <tr key={store.id}>
                          <td className="fw-semibold">
                            {store.name}
                          </td>

                          <td>{store.email}</td>

                          <td>
                            {store.address || "-"}
                          </td>

                          <td>
                            <span className="badge text-bg-warning">
                              ★ {store.rating}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;