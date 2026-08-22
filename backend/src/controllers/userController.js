const bcrypt = require("bcrypt");
const pool = require("../config/db");

const getStores = async (req, res) => {
  const {
    name = "",
    address = "",
    sortBy = "name",
    order = "asc",
  } = req.query;

  const allowedSortFields = {
    name: "s.name",
    address: "s.address",
    rating: "overall_rating",
  };

  const sortColumn =
    allowedSortFields[sortBy] || "s.name";

  const sortOrder =
    order.toLowerCase() === "desc"
      ? "DESC"
      : "ASC";

  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.name,
         s.address,

         COALESCE(
           ROUND(AVG(r.rating), 2),
           0
         ) AS overall_rating,

         COALESCE(
           MAX(
             CASE
               WHEN r.user_id = $3
               THEN r.rating
             END
           ),
           0
         ) AS user_rating

       FROM stores s

       LEFT JOIN ratings r
         ON s.id = r.store_id

       WHERE s.name ILIKE $1
         AND COALESCE(s.address, '') ILIKE $2

       GROUP BY s.id

       ORDER BY ${sortColumn} ${sortOrder}`,
      [
        `%${name}%`,
        `%${address}%`,
        req.user.id,
      ]
    );

    /*
     * Get recent ratings for every store.
     */
    const stores = await Promise.all(
      result.rows.map(async (store) => {
        const ratingsResult = await pool.query(
          `SELECT
             u.id,
             u.name,
             u.email,
             r.rating,
             r.created_at
           FROM ratings r
           JOIN users u
             ON u.id = r.user_id
           WHERE r.store_id = $1
           ORDER BY r.created_at DESC`,
          [store.id]
        );

        return {
          ...store,
          recent_ratings: ratingsResult.rows,
        };
      })
    );

    res.json({
      stores,
    });
  } catch (error) {
    console.error(
      "Failed to load stores:",
      error
    );

    res.status(500).json({
      message: "Failed to load stores",
    });
  }
};

const submitRating = async (req, res) => {
  const { storeId } = req.params;
  const { rating } = req.body;

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return res.status(400).json({
      message:
        "Rating must be an integer between 1 and 5",
    });
  }

  try {
    const store = await pool.query(
      "SELECT id FROM stores WHERE id = $1",
      [storeId]
    );

    if (store.rows.length === 0) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO ratings
        (user_id, store_id, rating)

       VALUES
        ($1, $2, $3)

       ON CONFLICT (user_id, store_id)

       DO UPDATE SET
         rating = EXCLUDED.rating,
         updated_at = CURRENT_TIMESTAMP

       RETURNING
         id,
         user_id,
         store_id,
         rating,
         updated_at`,
      [
        req.user.id,
        storeId,
        rating,
      ]
    );

    res.status(200).json({
      message:
        "Rating submitted successfully",

      rating: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Failed to submit rating:",
      error
    );

    res.status(500).json({
      message: "Failed to submit rating",
    });
  }
};

const updatePassword = async (req, res) => {
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

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await pool.query(
      `UPDATE users
       SET
         password = $1,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [
        hashedPassword,
        req.user.id,
      ]
    );

    res.json({
      message:
        "Password updated successfully",
    });
  } catch (error) {
    console.error(
      "Failed to update password:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update password",
    });
  }
};

module.exports = {
  getStores,
  submitRating,
  updatePassword,
};