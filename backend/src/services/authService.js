const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async ({ name, email, address, password }) => {
  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, $2, $3, $4, 'USER')
     RETURNING id, name, email, address, role`,
    [name, email, hashedPassword, address || null]
  );

  return result.rows[0];
};

const loginUser = async ({ email, password }) => {
  const result = await pool.query(
    `SELECT id, name, email, password, address, role
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = result.rows[0];

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  delete user.password;

  return {
    user,
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};