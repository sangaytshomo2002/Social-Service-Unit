const { pool } = require('../config/db');

class Registration {
  // ✅ Ensure table exists
  static async initTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS registrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          gender VARCHAR(50) NOT NULL,
          studentnumber VARCHAR(8) UNIQUE NOT NULL,
          cidnumber VARCHAR(11) NOT NULL,
          contactnumber VARCHAR(8) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          course VARCHAR(100) NOT NULL,
          year VARCHAR(50) NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Registrations table ensured');
    } catch (error) {
      console.error('❌ Error creating registrations table:', error);
      throw error;
    }
  }

  // ✅ Create a new registration
  static async create({
    name,
    gender,
    studentNumber,
    cidNumber,
    contactNumber,
    email,
    course,
    year,
    password // Already hashed in controller
  }) {
    const result = await pool.query(
      `
      INSERT INTO registrations 
        (name, gender, studentnumber, cidnumber, contactnumber, email, course, year, password)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, gender, studentnumber, cidnumber, contactnumber, email, course, year, status, created_at
      `,
      [name, gender, studentNumber, cidNumber, contactNumber, email, course, year, password]
    );
    return result.rows[0];
  }

  // ✅ Get registration by student number
  static async findByStudentNumber(studentNumber) {
    const result = await pool.query(
      'SELECT * FROM registrations WHERE studentnumber = $1',
      [studentNumber]
    );
    return result.rows[0];
  }

  // ✅ Get registration by email
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM registrations WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // ✅ Get registration by student number or email
  static async findByStudentOrEmail(studentNumber, email) {
    const result = await pool.query(
      'SELECT * FROM registrations WHERE studentnumber = $1 OR email = $2 LIMIT 1',
      [studentNumber, email]
    );
    return result.rows[0];
  }

  // ✅ Update status (admin)
  static async updateStatus(id, status) {
    const result = await pool.query(
      `
      UPDATE registrations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
      `,
      [status, id]
    );
    return result.rows[0];
  }

  // ✅ Get all registrations (admin)
  static async getAll() {
    const result = await pool.query(
      'SELECT * FROM registrations ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // ✅ Get all registrations by a user's email (more reliable than ID)
  static async getByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM registrations WHERE id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // ✅ Drop table
  static async dropTable() {
    try {
      await pool.query('DROP TABLE IF EXISTS registrations CASCADE');
      console.log('✅ Registrations table dropped');
    } catch (error) {
      console.error('❌ Error dropping registrations table:', error);
      throw error;
    }
  }
}

module.exports = Registration;
