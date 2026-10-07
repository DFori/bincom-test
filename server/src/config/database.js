require('dotenv').config();
const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const { getRawSqlDump, parseMysqlToSqlite } = require('../db/schemaLoader');

let mysqlPool = null;
let sqliteDb = null;
let activeDriver = 'none'; // 'mysql' | 'sqlite'
let initPromise = null;

/**
 * Initialize connection to MySQL or SQLite
 */
async function initDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const preferredDriver = (process.env.DB_DRIVER || 'auto').toLowerCase();

    // 1. If preferred driver is MySQL or 'auto', try connecting to MySQL
    if (preferredDriver === 'mysql' || preferredDriver === 'auto') {
      try {
        const pool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306', 10),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'bincomphptest',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          decimalNumbers: true
        });

        // Test connection
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();

        mysqlPool = pool;
        activeDriver = 'mysql';
        console.log(`✓ Connected to MySQL database [${process.env.DB_NAME || 'bincomphptest'}] on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
        return;
      } catch (err) {
        if (preferredDriver === 'mysql') {
          console.error('MySQL connection failed and DB_DRIVER=mysql is explicitly set:', err.message);
          throw err;
        }
        console.warn(`MySQL connection not available (${err.message}). Initializing embedded SQL database from bincom_test.sql...`);
      }
    }

    // 2. Initialize embedded SQLite engine seeded from bincom_test.sql
    await initEmbeddedSqlite();
  })();

  return initPromise;
}

/**
 * Initialize embedded SQL database from bincom_test.sql
 */
async function initEmbeddedSqlite() {
  const SQL = await initSqlJs();
  sqliteDb = new SQL.Database();

  const rawDump = getRawSqlDump();
  const statements = parseMysqlToSqlite(rawDump);

  for (const stmt of statements) {
    try {
      sqliteDb.run(stmt);
    } catch (e) {
      // Ignore DROP errors or empty statements
      if (!stmt.startsWith('DROP')) {
        console.warn('Warning executing seed statement in SQLite:', stmt.substring(0, 60), e.message);
      }
    }
  }

  activeDriver = 'sqlite';
  console.log('✓ Embedded SQL database successfully initialized and seeded with bincom_test.sql');
}

/**
 * Executes a parameterized SQL query
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array|Object>} Array of rows for SELECT or result metadata for mutations
 */
async function query(sql, params = []) {
  if (activeDriver === 'none') {
    await initDatabase();
  }

  // MySQL Execution
  if (activeDriver === 'mysql') {
    const [results] = await mysqlPool.query(sql, params);
    return results;
  }

  // Embedded SQLite Execution
  if (activeDriver === 'sqlite') {
    const trimmedSql = sql.trim();
    const isSelect = /^SELECT/i.test(trimmedSql) || /^WITH/i.test(trimmedSql);

    if (isSelect) {
      const stmt = sqliteDb.prepare(trimmedSql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }

      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } else {
      // INSERT, UPDATE, DELETE
      sqliteDb.run(trimmedSql, params);
      
      // Get last insert row id and changes
      const res = sqliteDb.exec("SELECT last_insert_rowid() AS insertId, changes() AS affectedRows");
      let insertId = 0;
      let affectedRows = 0;
      if (res.length > 0 && res[0].values.length > 0) {
        insertId = res[0].values[0][0];
        affectedRows = res[0].values[0][1];
      }

      return {
        insertId,
        affectedRows
      };
    }
  }

  throw new Error('No active database driver initialized');
}

/**
 * Returns current driver name
 */
function getDriver() {
  return activeDriver;
}

/**
 * Resets database (useful for test isolation)
 */
async function resetDatabase() {
  if (activeDriver === 'sqlite') {
    await initEmbeddedSqlite();
  }
}

/**
 * Closes the database connections
 */
async function close() {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  activeDriver = 'none';
  initPromise = null;
}

module.exports = {
  initDatabase,
  query,
  execute: query,
  getDriver,
  resetDatabase,
  close
};
