const fs = require('fs');
const path = require('path');

const SQL_FILE_PATH = path.resolve(__dirname, '../../../bincom_test.sql');

/**
 * Reads and parses the bincom_test.sql file
 * @returns {string} raw SQL content
 */
function getRawSqlDump() {
  if (!fs.existsSync(SQL_FILE_PATH)) {
    throw new Error(`SQL dump file not found at: ${SQL_FILE_PATH}`);
  }
  return fs.readFileSync(SQL_FILE_PATH, 'utf8');
}

/**
 * Prepares SQLite compatible SQL statements from MySQL dump
 * @param {string} mysqlDump
 * @returns {string[]} array of SQL queries
 */
function parseMysqlToSqlite(mysqlDump) {
  // Strip comments, SET statements, and MySQL-specific table engine/charset definitions
  let cleaned = mysqlDump
    .replace(/\/\*![\s\S]*?\*\//g, '') // Remove /*!40101 ... */
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/^SET\s+.*$/gim, '')
    .replace(/ENGINE\s*=\s*(MyISAM|InnoDB)[^;]*/gi, '')
    .replace(/DEFAULT\s+CHARSET\s*=\s*[a-zA-Z0-9_]+/gi, '')
    .replace(/AUTO_INCREMENT\s*=\s*\d+/gi, '')
    .replace(/COLLATE\s*=\s*[a-zA-Z0-9_]+/gi, '');

  // Handle MySQL datetime defaults like '0000-00-00 00:00:00' to NULL or safe string
  // Split into statements
  const rawStatements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const sqliteStatements = [];

  for (let stmt of rawStatements) {
    // In SQLite, AUTO_INCREMENT is AUTOINCREMENT and can only be used on INTEGER PRIMARY KEY
    if (/CREATE\s+TABLE/i.test(stmt)) {
      stmt = stmt
        .replace(/`uniqueid`\s+int\(\d+\)\s+NOT\s+NULL\s+AUTO_INCREMENT/gi, '`uniqueid` INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/`result_id`\s+int\(\d+\)\s+NOT\s+NULL\s+AUTO_INCREMENT/gi, '`result_id` INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/`id`\s+int\(\d+\)\s+NOT\s+NULL\s+AUTO_INCREMENT/gi, '`id` INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/`name_id`\s+int\(\d+\)\s+NOT\s+NULL\s+AUTO_INCREMENT/gi, '`name_id` INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/,\s*PRIMARY\s+KEY\s*\(`(?:uniqueid|result_id|id|name_id)`\)/gi, '')
        .replace(/int\(\d+\)/gi, 'INTEGER')
        .replace(/varchar\(\d+\)/gi, 'TEXT')
        .replace(/char\(\d+\)/gi, 'TEXT')
        .replace(/datetime/gi, 'TEXT');
    }

    // Replace invalid zero-dates '0000-00-00 00:00:00' with valid datetime string or null
    stmt = stmt.replace(/'0000-00-00 00:00:00'/g, "'2011-04-26 00:00:00'");

    sqliteStatements.push(stmt);
  }

  return sqliteStatements;
}

module.exports = {
  SQL_FILE_PATH,
  getRawSqlDump,
  parseMysqlToSqlite
};
