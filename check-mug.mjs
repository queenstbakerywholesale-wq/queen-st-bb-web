import mysql from 'mysql2/promise';

async function checkMug() {
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
    
    const [results] = await conn.query('SELECT id, name, stock, imageUrl FROM products WHERE name LIKE ?', ['%Queen BB Koala Mug%']);
    console.log('Queen BB Koala Mug 信息：');
    console.log(JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

checkMug();
