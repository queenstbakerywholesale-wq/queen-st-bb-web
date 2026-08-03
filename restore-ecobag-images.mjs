import mysql from 'mysql2/promise';

async function restoreImages() {
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

    // 恢复为用户上传的原始图片（简单的产品展示）
    const updates = [
      { name: 'Party Koala Eco Bag', imageUrl: '/manus-storage/ecobag-party-koala_a8354d99.png' },
      { name: 'Rainbow Koala Eco Bag', imageUrl: '/manus-storage/ecobag-rainbow-koala_a8354d99.png' },
      { name: 'Sunset Koala Eco Bag', imageUrl: '/manus-storage/ecobag-sunset-koala_a8354d99.png' },
    ];

    console.log('📦 恢复 Eco Bags 图片...');
    for (const update of updates) {
      await conn.query(`UPDATE products SET imageUrl = ? WHERE name = ?`, [update.imageUrl, update.name]);
      console.log(`  ✓ ${update.name}`);
    }

    console.log('\n✅ 所有 Eco Bags 图片已恢复！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

restoreImages();
