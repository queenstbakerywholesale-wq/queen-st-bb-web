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

    // 删除三个 mugs
    const mugsToDelete = ['Charcoal Grey Mug', 'Minimalist White Mug', 'Terracotta Earth Mug'];
    for (const mugName of mugsToDelete) {
      await conn.query('DELETE FROM products WHERE name = ?', [mugName]);
      console.log(`✓ ${mugName} 已删除`);
    }
    console.log();

    console.log('✅ 删除完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

updateMugs();
