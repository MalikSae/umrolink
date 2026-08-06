const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // matching .env
  });
  
  await connection.query('CREATE DATABASE IF NOT EXISTS umrolink_dev');
  console.log('Created umrolink_dev');
  
  await connection.query('CREATE DATABASE IF NOT EXISTS umrolink_test');
  console.log('Created umrolink_test');
  
  await connection.end();
}

main().catch(console.error);
