import mysql from 'mysql2/promise';

async function checkCategories() {
  let conn;
  try {
    const dbUrl = process.env.DATABASE_URL;
    const url = new URL(dbUrl);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {},
    };

    conn = await mysql.createConnection(config);
    
    const [results] = await conn.query('SELECT * FROM categories LIMIT 5');
    console.log('Categories 表内容：');
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

checkCategories();
