require('dotenv').config();
const mysql = require('mysql2/promise');
const { getRawSqlDump } = require('./schemaLoader');

async function seedMySQL() {
  console.log('--- Starting MySQL Database Seeding ---');
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  const dbName = process.env.DB_NAME || 'bincomphptest';

  let connection;
  try {
    console.log(`Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port} as ${dbConfig.user}...`);
    connection = await mysql.createConnection(dbConfig);
    console.log(`Creating database \`${dbName}\` if it does not exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    console.log('Reading SQL dump from bincom_test.sql...');
    const rawSql = getRawSqlDump();

    console.log('Executing database dump against MySQL...');
    await connection.query(rawSql);

    console.log(`✓ Successfully seeded database \`${dbName}\` from bincom_test.sql!`);
  } catch (error) {
    console.error('Failed to seed MySQL:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  seedMySQL();
}

module.exports = seedMySQL;
