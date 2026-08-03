import mysql from 'mysql2/promise';

async function fixProducts() {
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

    // 1. 统一所有 Eco Bags 价格为 25 AUD，库存改为 100
    console.log('📦 更新 Eco Bags...');
    await conn.query(`
      UPDATE products 
      SET price = '25.00', stock = 100 
      WHERE categoryId = (SELECT id FROM categories WHERE name = 'Eco Bags')
    `);
    console.log('  ✓ 所有 Eco Bags 价格统一为 $25.00，库存改为 100\n');

    // 2. 统一所有 Mugs 价格为 35.90 AUD，库存改为 100
    console.log('📦 更新 Mugs...');
    await conn.query(`
      UPDATE products 
      SET price = '35.90', stock = 100 
      WHERE categoryId = (SELECT id FROM categories WHERE name = 'Mugs')
    `);
    console.log('  ✓ 所有 Mugs 价格统一为 $35.90，库存改为 100\n');

    console.log('✅ 所有产品更新成功！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

fixProducts();
