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
  const [storeOwners, setStoreOwners] = useState([]);

  const [activeTab, setActiveTab] = useState("users");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] =
    useState(false);

  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);

  // USER FILTERS

  const [userFilters, setUserFilters] = useState({
    name: "",
    email: "",
    address: "",
    role: "",
  });

  const [userSort, setUserSort] = useState("name");
  const [userOrder, setUserOrder] = useState("asc");

  // STORE FILTERS

  const [storeFilters, setStoreFilters] = useState({
    name: "",
    email: "",
    address: "",
  });

  const [storeSort, setStoreSort] = useState("name");
  const [storeOrder, setStoreOrder] = useState("asc");

  // CREATE USER FORM

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "USER",
  });

  // CREATE STORE FORM

  const [storeForm, setStoreForm] = useState({
    name: "",
    email: "",
    address: "",
    ownerId: "",
  });

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const token = localStorage.getItem("token");

  // ==========================================
  // LOAD DASHBOARD + STORE OWNERS
  // ==========================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadInitialData = async () => {
      try {
        const [
          dashboardResponse,
          ownersResponse,
        ] = await Promise.all([
          axios.get(
            `${API_URL}/admin/dashboard`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          axios.get(
            `${API_URL}/admin/users`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                role: "STORE_OWNER",
                sortBy: "name",
                order: "asc",
              },
            }
          ),
        ]);

        setStats(dashboardResponse.data);

        setStoreOwners(
          ownersResponse.data.users || []
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load admin dashboard."
        );
      }
    };

    loadInitialData();
  }, [token]);

  // ==========================================
  // LOAD USERS
  // ==========================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadUsers = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/admin/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              ...userFilters,
              sortBy: userSort,
              order: userOrder,
            },
          }
        );

        setUsers(
          response.data.users || []
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load users."
        );
      }
    };

    loadUsers();
  }, [
    token,
    userFilters,
    userSort,
    userOrder,
  ]);

  // ==========================================
  // LOAD STORES
  // ==========================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadStores = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/admin/stores`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              ...storeFilters,
              sortBy: storeSort,
              order: storeOrder,
            },
          }
        );

        setStores(
          response.data.stores || []
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load stores."
        );
      }
    };

    loadStores();
  }, [
    token,
    storeFilters,
    storeSort,
    storeOrder,
  ]);

  // ==========================================
  // USER FORM
  // ==========================================

  const handleUserFormChange = (event) => {
    const { name, value } = event.target;

    setUserForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================
  // STORE FORM
  // ==========================================

  const handleStoreFormChange = (event) => {
    const { name, value } = event.target;

    setStoreForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE USER
  // ==========================================

  const handleCreateUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const {
      name,
      email,
      password,
      address,
      role,
    } = userForm;

    if (
      name.trim().length < 20 ||
      name.trim().length > 60
    ) {
      setError(
        "Name must be between 20 and 60 characters."
      );
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (
      password.length < 8 ||
      password.length > 16 ||
      !/[A-Z]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        "Password must be 8-16 characters and contain an uppercase letter and special character."
      );
      return;
    }

    if (address.trim().length > 400) {
      setError(
        "Address cannot exceed 400 characters."
      );
      return;
    }

    try {
      setCreatingUser(true);

      await axios.post(
        `${API_URL}/admin/users`,
        {
          name: name.trim(),
          email: email.trim(),
          password,
          address: address.trim(),
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        `${role} user created successfully.`
      );

      setUserForm({
        name: "",
        email: "",
        password: "",
        address: "",
        role: "USER",
      });

      // Refresh dashboard statistics
      const dashboardResponse =
        await axios.get(
          `${API_URL}/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setStats(dashboardResponse.data);

      // Refresh Store Owner dropdown
      const ownersResponse =
        await axios.get(
          `${API_URL}/admin/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              role: "STORE_OWNER",
              sortBy: "name",
              order: "asc",
            },
          }
        );

      setStoreOwners(
        ownersResponse.data.users || []
      );

      setActiveTab("users");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create user."
      );
    } finally {
      setCreatingUser(false);
    }
  };

  // ==========================================
  // CREATE STORE
  // ==========================================

  const handleCreateStore = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const {
      name,
      email,
      address,
      ownerId,
    } = storeForm;

    if (!name.trim()) {
      setError("Store name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Store email is required.");
      return;
    }

    if (!address.trim()) {
      setError("Store address is required.");
      return;
    }

    if (address.trim().length > 400) {
      setError(
        "Store address cannot exceed 400 characters."
      );
      return;
    }

    if (!ownerId) {
      setError(
        "Please select a Store Owner."
      );
      return;
    }

    try {
      setCreatingStore(true);

      // Create store
      await axios.post(
        `${API_URL}/admin/stores`,
        {
          name: name.trim(),
          email: email.trim(),
          address: address.trim(),
          ownerId: Number(ownerId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        "Store created successfully."
      );

      // Clear form
      setStoreForm({
        name: "",
        email: "",
        address: "",
        ownerId: "",
      });

      /*
       * IMPORTANT:
       * Refresh dashboard statistics AND
       * stores immediately after creation.
       */

      const [
        dashboardResponse,
        storesResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        axios.get(
          `${API_URL}/admin/stores`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              ...storeFilters,
              sortBy: storeSort,
              order: storeOrder,
            },
          }
        ),
      ]);

      // Update total statistics
      setStats(
        dashboardResponse.data
      );

      // Update stores table immediately
      setStores(
        storesResponse.data.stores || []
      );

      // Go to Stores tab
      setActiveTab("stores");
    } catch (err) {
      console.error(
        "Create store error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create store."
      );
    } finally {
      setCreatingStore(false);
    }
  };

  // ==========================================
  // VIEW USER DETAILS
  // ==========================================

  const handleViewUser = async (id) => {
    setError("");
    setSelectedUser(null);
    setLoadingUserDetails(true);

    try {
      const response = await axios.get(
        `${API_URL}/admin/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedUser(
        response.data.user
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load user details."
      );
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  // ==========================================
  // FILTER HELPERS
  // ==========================================

  const updateUserFilter = (
    field,
    value
  ) => {
    setUserFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateStoreFilter = (
    field,
    value
  ) => {
    setStoreFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="container-fluid px-4 py-3">

      {/* ======================================
          NAVBAR
      ======================================= */}

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

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="mb-4">

        <h2>Admin Dashboard</h2>

        <p className="text-muted">
          Manage users, stores and ratings.
        </p>

      </div>

      {/* ======================================
          MESSAGES
      ======================================= */}

      {error && (
        <div className="alert alert-danger">
          {error}

          <button
            type="button"
            className="btn-close float-end"
            onClick={() => setError("")}
          />
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}

          <button
            type="button"
            className="btn-close float-end"
            onClick={() =>
              setSuccess("")
            }
          />
        </div>
      )}

      {/* ======================================
          STATISTICS
      ======================================= */}

      <div className="row g-3 mb-4">

        <div className="col-md-4">

          <div className="card border-0 shadow-sm h-100">

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

          <div className="card border-0 shadow-sm h-100">

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

          <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

              <p className="text-muted mb-1">
                Total Submitted Ratings
              </p>

              <h2 className="mb-0">
                {stats.totalRatings}
              </h2>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================
          MAIN CARD
      ======================================= */}

      <div className="card border-0 shadow-sm">

        {/* ====================================
            TABS
        ===================================== */}

        <div className="card-header bg-white">

          <ul className="nav nav-tabs card-header-tabs">

            <li className="nav-item">

              <button
                type="button"
                className={`nav-link ${
                  activeTab === "users"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab("users");
                  setError("");
                  setSuccess("");
                }}
              >
                Users
              </button>

            </li>

            <li className="nav-item">

              <button
                type="button"
                className={`nav-link ${
                  activeTab === "stores"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab("stores");
                  setError("");
                  setSuccess("");
                }}
              >
                Stores
              </button>

            </li>

            <li className="nav-item">

              <button
                type="button"
                className={`nav-link ${
                  activeTab ===
                  "create-user"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab(
                    "create-user"
                  );
                  setError("");
                  setSuccess("");
                }}
              >
                + Create User
              </button>

            </li>

            <li className="nav-item">

              <button
                type="button"
                className={`nav-link ${
                  activeTab ===
                  "create-store"
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setActiveTab(
                    "create-store"
                  );
                  setError("");
                  setSuccess("");
                }}
              >
                + Create Store
              </button>

            </li>

          </ul>

        </div>

        <div className="card-body">

          {/* ==================================
              USERS
          =================================== */}

          {activeTab === "users" && (
            <>

              <div className="mb-4">

                <h5>Users</h5>

                <p className="text-muted">
                  Search, filter and view
                  registered users.
                </p>

              </div>

              {/* USER FILTERS */}

              <div className="row g-3 mb-4">

                <div className="col-md-3">

                  <label className="form-label">
                    Name
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name"
                    value={
                      userFilters.name
                    }
                    onChange={(event) =>
                      updateUserFilter(
                        "name",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="col-md-3">

                  <label className="form-label">
                    Email
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by email"
                    value={
                      userFilters.email
                    }
                    onChange={(event) =>
                      updateUserFilter(
                        "email",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="col-md-3">

                  <label className="form-label">
                    Address
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by address"
                    value={
                      userFilters.address
                    }
                    onChange={(event) =>
                      updateUserFilter(
                        "address",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="col-md-3">

                  <label className="form-label">
                    Role
                  </label>

                  <select
                    className="form-select"
                    value={
                      userFilters.role
                    }
                    onChange={(event) =>
                      updateUserFilter(
                        "role",
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      All Roles
                    </option>

                    <option value="USER">
                      Normal User
                    </option>

                    <option value="ADMIN">
                      Admin
                    </option>

                    <option value="STORE_OWNER">
                      Store Owner
                    </option>

                  </select>

                </div>

              </div>

              {/* USER SORT */}

              <div className="row g-3 mb-4">

                <div className="col-md-3">

                  <label className="form-label">
                    Sort By
                  </label>

                  <select
                    className="form-select"
                    value={userSort}
                    onChange={(event) =>
                      setUserSort(
                        event.target.value
                      )
                    }
                  >

                    <option value="name">
                      Name
                    </option>

                    <option value="email">
                      Email
                    </option>

                    <option value="address">
                      Address
                    </option>

                    <option value="role">
                      Role
                    </option>

                  </select>

                </div>

                <div className="col-md-3">

                  <label className="form-label">
                    Order
                  </label>

                  <select
                    className="form-select"
                    value={userOrder}
                    onChange={(event) =>
                      setUserOrder(
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

              {/* USER TABLE */}

              <div className="table-responsive">

                <table className="table table-hover align-middle">

                  <thead className="table-light">

                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>

                  </thead>

                  <tbody>

                    {users.length === 0 ? (

                      <tr>

                        <td
                          colSpan="5"
                          className="text-center py-5 text-muted"
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

                          <td>
                            {item.email}
                          </td>

                          <td>
                            {item.address ||
                              "-"}
                          </td>

                          <td>

                            <span className="badge text-bg-secondary">
                              {item.role}
                            </span>

                          </td>

                          <td>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                handleViewUser(
                                  item.id
                                )
                              }
                            >
                              View Details
                            </button>

                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </>
          )}

          {/* ==================================
              STORES
          =================================== */}

          {activeTab === "stores" && (
            <>

              <div className="mb-4">

                <h5>Stores</h5>

                <p className="text-muted">
                  View and filter all
                  registered stores.
                </p>

              </div>

              {/* STORE FILTERS */}

              <div className="row g-3 mb-4">

                <div className="col-md-4">

                  <label className="form-label">
                    Name
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name"
                    value={
                      storeFilters.name
                    }
                    onChange={(event) =>
                      updateStoreFilter(
                        "name",
                        event.target.value
                      )
                    }
                  />

                </div>

                <div className="col-md-4">

                  <label className="form-label">
                    Email
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by email"
                    value={
                      storeFilters.email
                    }
                    onChange={(event) =>
                      updateStoreFilter(
                        "email",
                        event.target.value
                      )
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
                    placeholder="Search by address"
                    value={
                      storeFilters.address
                    }
                    onChange={(event) =>
                      updateStoreFilter(
                        "address",
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* STORE SORT */}

              <div className="row g-3 mb-4">

                <div className="col-md-3">

                  <label className="form-label">
                    Sort By
                  </label>

                  <select
                    className="form-select"
                    value={storeSort}
                    onChange={(event) =>
                      setStoreSort(
                        event.target.value
                      )
                    }
                  >

                    <option value="name">
                      Name
                    </option>

                    <option value="email">
                      Email
                    </option>

                    <option value="address">
                      Address
                    </option>

                    <option value="rating">
                      Rating
                    </option>

                  </select>

                </div>

                <div className="col-md-3">

                  <label className="form-label">
                    Order
                  </label>

                  <select
                    className="form-select"
                    value={storeOrder}
                    onChange={(event) =>
                      setStoreOrder(
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

              {/* STORE TABLE */}

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
                          className="text-center py-5 text-muted"
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

                          <td>
                            {store.email}
                          </td>

                          <td>
                            {store.address ||
                              "-"}
                          </td>

                          <td>

                            <span className="badge text-bg-warning">
                              ★{" "}
                              {store.rating}
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

          {/* ==================================
              CREATE USER
          =================================== */}

          {activeTab ===
            "create-user" && (
            <div className="row justify-content-center">

              <div className="col-lg-8">

                <div className="mb-4">

                  <h4>
                    Create New User
                  </h4>

                  <p className="text-muted">
                    Create a Normal User,
                    Admin or Store Owner
                    account.
                  </p>

                </div>

                <form
                  onSubmit={
                    handleCreateUser
                  }
                >

                  {/* NAME */}

                  <div className="mb-3">

                    <label className="form-label">
                      Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter full name"
                      value={
                        userForm.name
                      }
                      onChange={
                        handleUserFormChange
                      }
                      minLength="20"
                      maxLength="60"
                      required
                    />

                    <small className="text-muted">
                      {
                        userForm.name
                          .length
                      }{" "}
                      / 60 characters
                    </small>

                  </div>

                  {/* EMAIL */}

                  <div className="mb-3">

                    <label className="form-label">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="user@example.com"
                      value={
                        userForm.email
                      }
                      onChange={
                        handleUserFormChange
                      }
                      required
                    />

                  </div>

                  {/* PASSWORD */}

                  <div className="mb-3">

                    <label className="form-label">
                      Password
                    </label>

                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      placeholder="8-16 characters"
                      value={
                        userForm.password
                      }
                      onChange={
                        handleUserFormChange
                      }
                      minLength="8"
                      maxLength="16"
                      required
                    />

                    <small className="text-muted">
                      Must contain an uppercase
                      letter and special
                      character.
                    </small>

                  </div>

                  {/* ADDRESS */}

                  <div className="mb-3">

                    <label className="form-label">
                      Address
                    </label>

                    <textarea
                      name="address"
                      className="form-control"
                      rows="4"
                      maxLength="400"
                      placeholder="Enter address"
                      value={
                        userForm.address
                      }
                      onChange={
                        handleUserFormChange
                      }
                      required
                    />

                    <small className="text-muted">
                      {
                        userForm.address
                          .length
                      }{" "}
                      / 400 characters
                    </small>

                  </div>

                  {/* ROLE */}

                  <div className="mb-4">

                    <label className="form-label">
                      Role
                    </label>

                    <select
                      name="role"
                      className="form-select"
                      value={
                        userForm.role
                      }
                      onChange={
                        handleUserFormChange
                      }
                    >

                      <option value="USER">
                        Normal User
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>

                      <option value="STORE_OWNER">
                        Store Owner
                      </option>

                    </select>

                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      creatingUser
                    }
                  >
                    {creatingUser
                      ? "Creating User..."
                      : "Create User"}
                  </button>

                </form>

              </div>

            </div>
          )}

          {/* ==================================
              CREATE STORE
          =================================== */}

          {activeTab ===
            "create-store" && (
            <div className="row justify-content-center">

              <div className="col-lg-8">

                <div className="mb-4">

                  <h4>
                    Create New Store
                  </h4>

                  <p className="text-muted">
                    Create a store and
                    assign it to a Store
                    Owner.
                  </p>

                </div>

                <form
                  onSubmit={
                    handleCreateStore
                  }
                >

                  {/* STORE NAME */}

                  <div className="mb-3">

                    <label className="form-label">
                      Store Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter store name"
                      value={
                        storeForm.name
                      }
                      onChange={
                        handleStoreFormChange
                      }
                      maxLength="60"
                      required
                    />

                  </div>

                  {/* STORE EMAIL */}

                  <div className="mb-3">

                    <label className="form-label">
                      Store Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="store@example.com"
                      value={
                        storeForm.email
                      }
                      onChange={
                        handleStoreFormChange
                      }
                      required
                    />

                  </div>

                  {/* STORE ADDRESS */}

                  <div className="mb-3">

                    <label className="form-label">
                      Store Address
                    </label>

                    <textarea
                      name="address"
                      className="form-control"
                      rows="4"
                      maxLength="400"
                      placeholder="Enter store address"
                      value={
                        storeForm.address
                      }
                      onChange={
                        handleStoreFormChange
                      }
                      required
                    />

                    <small className="text-muted">
                      {
                        storeForm.address
                          .length
                      }{" "}
                      / 400 characters
                    </small>

                  </div>

                  {/* STORE OWNER */}

                  <div className="mb-4">

                    <label className="form-label">
                      Store Owner
                    </label>

                    <select
                      name="ownerId"
                      className="form-select"
                      value={
                        storeForm.ownerId
                      }
                      onChange={
                        handleStoreFormChange
                      }
                      required
                    >

                      <option value="">
                        Select Store Owner
                      </option>

                      {storeOwners.map(
                        (owner) => (
                          <option
                            key={
                              owner.id
                            }
                            value={
                              owner.id
                            }
                          >
                            {owner.name} —{" "}
                            {owner.email}
                          </option>
                        )
                      )}

                    </select>

                    {storeOwners.length ===
                      0 && (
                      <small className="text-danger">
                        No Store Owner
                        accounts exist.
                        Create a Store Owner
                        user first.
                      </small>
                    )}

                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      creatingStore ||
                      storeOwners.length ===
                        0
                    }
                  >
                    {creatingStore
                      ? "Creating Store..."
                      : "Create Store"}
                  </button>

                </form>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* ======================================
          USER DETAILS MODAL
      ======================================= */}

      {(selectedUser ||
        loadingUserDetails) && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.5)",
          }}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <h5 className="modal-title">
                  User Details
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                />

              </div>

              <div className="modal-body">

                {loadingUserDetails ? (

                  <div className="text-center py-4">

                    <div
                      className="spinner-border"
                      role="status"
                    />

                    <p className="text-muted mt-2 mb-0">
                      Loading user details...
                    </p>

                  </div>

                ) : selectedUser ? (

                  <>

                    <div className="mb-3">

                      <small className="text-muted">
                        Name
                      </small>

                      <div className="fw-semibold">
                        {selectedUser.name}
                      </div>

                    </div>

                    <div className="mb-3">

                      <small className="text-muted">
                        Email
                      </small>

                      <div>
                        {selectedUser.email}
                      </div>

                    </div>

                    <div className="mb-3">

                      <small className="text-muted">
                        Address
                      </small>

                      <div>
                        {selectedUser.address ||
                          "-"}
                      </div>

                    </div>

                    <div className="mb-3">

                      <small className="text-muted">
                        Role
                      </small>

                      <div>

                        <span className="badge text-bg-secondary">
                          {selectedUser.role}
                        </span>

                      </div>

                    </div>

                    {selectedUser.role ===
                      "STORE_OWNER" && (
                      <div className="border rounded p-3">

                        <small className="text-muted">
                          Store Rating
                        </small>

                        <h3 className="mb-0 mt-1">
                          ★{" "}
                          {Number(
                            selectedUser.rating ||
                              0
                          ).toFixed(2)}
                        </h3>

                      </div>
                    )}

                  </>

                ) : null}

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setSelectedUser(null)
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminDashboard;