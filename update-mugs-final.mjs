import mysql from 'mysql2/promise';

async function updateMugs() {
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
    console.log('✓ 数据库连接成功\n');

    // 删除 Queen BB Koala Mug
    await conn.query('DELETE FROM products WHERE name = ?', ['Queen BB Koala Mug']);
    console.log('✓ Queen BB Koala Mug 已删除');

    // 标记 BB Koala Flag Mug 为 sold out
    await conn.query('UPDATE products SET stock = 0 WHERE name = ?', ['BB Koala Flag Mug']);
    console.log('✓ BB Koala Flag Mug 已标记为 sold out\n');

    console.log('✅ 更新完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

updateMugs();
