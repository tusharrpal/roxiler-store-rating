const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const createUser = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { name, email, password, address, role } = req.body;

  if (!["ADMIN", "USER", "STORE_OWNER"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, address, role`,
      [name, email, hashedPassword, address || null, role]
    );

    res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create user",
    });
  }
};

const createStore = async (req, res) => {
  const { name, email, address, ownerId } = req.body;

  if (!name || !email || !ownerId) {
    return res.status(400).json({
      message: "Name, email and ownerId are required",
    });
  }

  try {
    const owner = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [ownerId]
    );

    if (owner.rows.length === 0) {
      return res.status(404).json({
        message: "Store owner not found",
      });
    }

    if (owner.rows[0].role !== "STORE_OWNER") {
      return res.status(400).json({
        message: "Selected user is not a store owner",
      });
    }

    const result = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id`,
      [name, email, address || null, ownerId]
    );

    res.status(201).json({
      message: "Store created successfully",
      store: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create store",
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const [users, stores, ratings] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM stores"),
      pool.query("SELECT COUNT(*) FROM ratings"),
    ]);

    res.json({
      totalUsers: Number(users.rows[0].count),
      totalStores: Number(stores.rows[0].count),
      totalRatings: Number(ratings.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

const getUsers = async (req, res) => {
  const {
    name = "",
    email = "",
    address = "",
    role = "",
    sortBy = "name",
    order = "asc",
  } = req.query;

  const allowedSortFields = {
    name: "u.name",
    email: "u.email",
    address: "u.address",
    role: "u.role",
  };

  const sortColumn = allowedSortFields[sortBy] || "u.name";
  const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.address,
         u.role
       FROM users u
       WHERE u.name ILIKE $1
         AND u.email ILIKE $2
         AND COALESCE(u.address, '') ILIKE $3
         AND ($4 = '' OR u.role = $4)
       ORDER BY ${sortColumn} ${sortOrder}`,
      [`%${name}%`, `%${email}%`, `%${address}%`, role]
    );

    res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to load users",
    });
  }
};

const getStores = async (req, res) => {
  const {
    name = "",
    email = "",
    address = "",
    sortBy = "name",
    order = "asc",
  } = req.query;

  const allowedSortFields = {
    name: "s.name",
    email: "s.email",
    address: "s.address",
    rating: "average_rating",
  };

  const sortColumn = allowedSortFields[sortBy] || "s.name";
  const sortOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.name,
         s.email,
         s.address,
         COALESCE(ROUND(AVG(r.rating), 2), 0) AS rating
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.name ILIKE $1
         AND s.email ILIKE $2
         AND COALESCE(s.address, '') ILIKE $3
       GROUP BY s.id
       ORDER BY ${sortColumn} ${sortOrder}`,
      [`%${name}%`, `%${email}%`, `%${address}%`]
    );

    res.json({
      stores: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to load stores",
    });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.address,
         u.role,
         CASE
           WHEN u.role = 'STORE_OWNER'
           THEN COALESCE(ROUND(AVG(r.rating), 2), 0)
           ELSE NULL
         END AS rating
       FROM users u
       LEFT JOIN stores s ON s.owner_id = u.id
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to load user",
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    const result = await pool.query(
      "SELECT password FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      result.rows[0].password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await pool.query(
      `UPDATE users
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, req.user.id]
    );

    return res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to update password",
    });
  }
};

module.exports = {
  createUser,
  createStore,
  getDashboard,
  getUsers,
  getStores,
  getUserById,
  updatePassword,
};