const bcrypt = require("bcrypt");
const pool = require("../config/db");

const getDashboard = async (req, res) => {
  try {
    const storeResult = await pool.query(
      `SELECT id, name, email, address
       FROM stores
       WHERE owner_id = $1`,
      [req.user.id]
    );

    if (storeResult.rows.length === 0) {
      return res.status(404).json({
        message: "No store found for this owner",
      });
    }

    const stores = [];

    for (const store of storeResult.rows) {
      const ratingResult = await pool.query(
        `SELECT
           COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating,
           COUNT(r.id) AS total_ratings
         FROM ratings r
         WHERE r.store_id = $1`,
        [store.id]
      );

      const usersResult = await pool.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           r.rating,
           r.created_at
         FROM ratings r
         JOIN users u ON u.id = r.user_id
         WHERE r.store_id = $1
         ORDER BY r.created_at DESC`,
        [store.id]
      );

      stores.push({
        ...store,
        averageRating: Number(ratingResult.rows[0].average_rating),
        totalRatings: Number(ratingResult.rows[0].total_ratings),
        users: usersResult.rows,
      });
    }

    res.json({
      stores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to load owner dashboard",
    });
  }
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required",
    });
  }

  if (
    newPassword.length < 8 ||
    newPassword.length > 16 ||
    !/[A-Z]/.test(newPassword) ||
    !/[^A-Za-z0-9]/.test(newPassword)
  ) {
    return res.status(400).json({
      message:
        "Password must be 8-16 characters and contain an uppercase letter and special character",
    });
  }

  try {
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, req.user.id]
    );

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update password",
    });
  }
};

module.exports = {
  getDashboard,
  updatePassword,
};