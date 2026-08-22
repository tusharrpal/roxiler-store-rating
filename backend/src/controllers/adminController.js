const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

// =====================================================
// CREATE USER
// =====================================================

const createUser = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const {
    name,
    email,
    password,
    address,
    role,
  } = req.body;

  if (!["ADMIN", "USER", "STORE_OWNER"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  try {
    // Check duplicate email
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, address, role`,
      [
        name.trim(),
        email.trim(),
        hashedPassword,
        address?.trim() || null,
        role,
      ]
    );

    return res.status(201).json({
      message: "User created successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      "CREATE USER ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
};

// =====================================================
// CREATE STORE
// =====================================================

const createStore = async (req, res) => {
  const {
    name,
    email,
    address,
    ownerId,
  } = req.body;

  // Basic validation
  if (
    !name ||
    !email ||
    !address ||
    !ownerId
  ) {
    return res.status(400).json({
      message:
        "Store name, email, address and owner are required",
    });
  }

  try {
    // ---------------------------------------------
    // Find selected Store Owner
    // ---------------------------------------------

    const ownerResult = await pool.query(
      `SELECT
         id,
         name,
         email,
         role
       FROM users
       WHERE id = $1`,
      [ownerId]
    );

    if (ownerResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Selected store owner not found",
      });
    }

    const owner = ownerResult.rows[0];

    // ---------------------------------------------
    // Make sure selected user is STORE_OWNER
    // ---------------------------------------------

    if (owner.role !== "STORE_OWNER") {
      return res.status(400).json({
        message:
          "Selected user must have STORE_OWNER role",
      });
    }

    // ---------------------------------------------
    // Create store
    // ---------------------------------------------

    const result = await pool.query(
      `INSERT INTO stores
       (
         name,
         email,
         address,
         owner_id
       )
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         name,
         email,
         address,
         owner_id`,
      [
        name.trim(),
        email.trim(),
        address.trim(),
        owner.id,
      ]
    );

    // ---------------------------------------------
    // Return created store + owner information
    // ---------------------------------------------

    return res.status(201).json({
      message: "Store created successfully",

      store: result.rows[0],

      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error(
      "CREATE STORE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to create store",
    });
  }
};

// =====================================================
// ADMIN DASHBOARD
// =====================================================

const getDashboard = async (req, res) => {
  try {
    const [
      users,
      stores,
      ratings,
    ] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) FROM users"
      ),

      pool.query(
        "SELECT COUNT(*) FROM stores"
      ),

      pool.query(
        "SELECT COUNT(*) FROM ratings"
      ),
    ]);

    return res.json({
      totalUsers: Number(
        users.rows[0].count
      ),

      totalStores: Number(
        stores.rows[0].count
      ),

      totalRatings: Number(
        ratings.rows[0].count
      ),
    });
  } catch (error) {
    console.error(
      "DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load dashboard",
    });
  }
};

// =====================================================
// GET USERS
// =====================================================

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

  const sortColumn =
    allowedSortFields[sortBy] ||
    "u.name";

  const sortOrder =
    order.toLowerCase() === "desc"
      ? "DESC"
      : "ASC";

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
         AND COALESCE(
           u.address,
           ''
         ) ILIKE $3
         AND (
           $4 = ''
           OR u.role = $4
         )
       ORDER BY
         ${sortColumn}
         ${sortOrder}`,
      [
        `%${name}%`,
        `%${email}%`,
        `%${address}%`,
        role,
      ]
    );

    return res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error(
      "GET USERS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to load users",
    });
  }
};

// =====================================================
// GET STORES
// =====================================================

const getStores = async (req, res) => {
  const {
    name = "",
    email = "",
    address = "",
    sortBy = "name",
    order = "asc",
  } = req.query;

  /*
   * IMPORTANT:
   *
   * The rating is calculated in the SELECT query
   * using AVG(r.rating).
   *
   * We use the same alias "rating" for sorting.
   */

  const allowedSortFields = {
    name: "s.name",
    email: "s.email",
    address: "s.address",
    rating: "rating",
  };

  const sortColumn =
    allowedSortFields[sortBy] ||
    "s.name";

  const sortOrder =
    order.toLowerCase() === "desc"
      ? "DESC"
      : "ASC";

  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.name,
         s.email,
         s.address,

         COALESCE(
           ROUND(
             AVG(r.rating),
             2
           ),
           0
         ) AS rating

       FROM stores s

       LEFT JOIN ratings r
         ON s.id = r.store_id

       WHERE s.name ILIKE $1
         AND s.email ILIKE $2
         AND COALESCE(
           s.address,
           ''
         ) ILIKE $3

       GROUP BY
         s.id,
         s.name,
         s.email,
         s.address

       ORDER BY
         ${sortColumn}
         ${sortOrder}`,
      [
        `%${name}%`,
        `%${email}%`,
        `%${address}%`,
      ]
    );

    return res.json({
      stores: result.rows,
    });
  } catch (error) {
    console.error(
      "GET STORES ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to load stores",
    });
  }
};

// =====================================================
// GET USER BY ID
// =====================================================

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
           THEN COALESCE(
             ROUND(
               AVG(r.rating),
               2
             ),
             0
           )
           ELSE NULL
         END AS rating

       FROM users u

       LEFT JOIN stores s
         ON s.owner_id = u.id

       LEFT JOIN ratings r
         ON r.store_id = s.id

       WHERE u.id = $1

       GROUP BY
         u.id,
         u.name,
         u.email,
         u.address,
         u.role`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error(
      "GET USER BY ID ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to load user",
    });
  }
};

// =====================================================
// UPDATE PASSWORD
// =====================================================

const updatePassword = async (
  req,
  res
) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message:
          "Current password and new password are required",
      });
    }

    // Password validation
    if (
      newPassword.length < 8 ||
      newPassword.length > 16 ||
      !/[A-Z]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(
        newPassword
      )
    ) {
      return res.status(400).json({
        message:
          "Password must be 8-16 characters and contain an uppercase letter and special character",
      });
    }

    // Get current password
    const result = await pool.query(
      `SELECT password
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Compare passwords
    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        result.rows[0].password
      );

    if (!passwordMatch) {
      return res.status(400).json({
        message:
          "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    // Update password
    await pool.query(
      `UPDATE users
       SET
         password = $1,
         updated_at =
           CURRENT_TIMESTAMP
       WHERE id = $2`,
      [
        hashedPassword,
        req.user.id,
      ]
    );

    return res.json({
      message:
        "Password updated successfully",
    });
  } catch (error) {
    console.error(
      "UPDATE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update password",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createUser,
  createStore,
  getDashboard,
  getUsers,
  getStores,
  getUserById,
  updatePassword,
};