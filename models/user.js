const { pool } = require('../config/db');

class User {
  // ✅ Create a new user
  static async create({
    name,
    email,
    password,
    studentId,
    course,
    cid,
    phone,
    role = 'user',
    verification_code = null,
    verification_expires = null,
    is_verified = false
  }) {
    const result = await pool.query(
      `
      INSERT INTO users 
        (name, email, password, studentId, course, cid, phone, role, verification_code, verification_expires, is_verified)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, email, studentId, course, cid, phone, role, is_verified, created_at
      `,
      [name, email, password, studentId, course, cid, phone, role, verification_code, verification_expires, is_verified]
    );
    return result.rows[0];
  }

  // ✅ Find user by email
  static async findOne({ email }) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // ✅ Find user by ID
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // ✅ Update user verification status
  static async updateVerification(email, isVerified) {
    const result = await pool.query(
      `
      UPDATE users 
      SET is_verified = $1, 
          verification_code = NULL,
          verification_expires = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $2 
      RETURNING *
      `,
      [isVerified, email]
    );
    return result.rows[0];
  }

  // ✅ Update verification code
  static async updateVerificationCode(email, code, expires) {
    const result = await pool.query(
      `
      UPDATE users 
      SET verification_code = $1,
          verification_expires = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $3 
      RETURNING *
      `,
      [code, expires, email]
    );
    return result.rows[0];
  }
}

module.exports = User;
