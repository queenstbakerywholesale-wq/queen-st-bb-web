import mysql from 'mysql2/promise';

async function updateMug() {
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

    // 标记 Queen BB Koala Mug 为 sold out（库存改为 0）
    await conn.query('UPDATE products SET stock = 0 WHERE name = ?', ['Queen BB Koala Mug']);
    console.log('✓ Queen BB Koala Mug 已标记为 sold out\n');

    console.log('✅ 更新完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

updateMug();
