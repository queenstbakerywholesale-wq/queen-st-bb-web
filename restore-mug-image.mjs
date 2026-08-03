import mysql from 'mysql2/promise';

async function restoreMugImage() {
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

    // 恢复原始图片 URL
    await conn.query(
      'UPDATE products SET imageUrl = ? WHERE name = ?',
      ['/manus-storage/IMG_0706_76f42cf5.JPG', 'Queen BB Koala Mug']
    );
    console.log('✓ Queen BB Koala Mug 图片已恢复为原始上传的图片\n');

    console.log('✅ 恢复完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

restoreMugImage();
