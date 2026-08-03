import mysql from 'mysql2/promise';

async function updateProducts() {
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

    // 1. 更新 Party Koala Eco Bag 图片
    console.log('📦 更新 Eco Bags 图片...');
    await conn.query(`
      UPDATE products 
      SET imageUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/party-koala-ecobag-styled-ADAmhf9hrhizfHCmNB2jt6.webp'
      WHERE name = 'Party Koala Eco Bag'
    `);
    console.log('  ✓ Party Koala Eco Bag 图片已更新');

    // 2. 更新 Rainbow Koala Eco Bag 图片
    await conn.query(`
      UPDATE products 
      SET imageUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/fairy-koala-ecobag-styled-UMkNwi4SgQzdgnXhyPiHS5.webp'
      WHERE name = 'Rainbow Koala Eco Bag'
    `);
    console.log('  ✓ Rainbow Koala Eco Bag 图片已更新\n');

    // 3. 标记三个新 Mugs 为 sold out（库存改为 0）
    console.log('📦 标记新 Mugs 为 sold out...');
    await conn.query(`
      UPDATE products 
      SET stock = 0
      WHERE name IN ('Minimalist White Mug', 'Terracotta Earth Mug', 'Charcoal Grey Mug')
    `);
    console.log('  ✓ 三个新 Mugs 已标记为 sold out\n');

    console.log('✅ 所有产品已更新成功！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

updateProducts();
