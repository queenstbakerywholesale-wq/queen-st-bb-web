import mysql from 'mysql2/promise';

async function updateMugImage() {
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

    // 更新图片 URL
    await conn.query(
      'UPDATE products SET imageUrl = ? WHERE name = ?',
      ['https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/queen-bb-koala-mug-3-4-ncVKwqqNUf56mHjorPjPKB.webp', 'Queen BB Koala Mug']
    );
    console.log('✓ Queen BB Koala Mug 图片已更新为 3:4 比例\n');

    console.log('✅ 更新完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

updateMugImage();
