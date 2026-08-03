import mysql from 'mysql2/promise';

async function updateEcobags() {
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

    // 删除三个 eco bags
    const bagsToDelete = ['Birthday Cake Koala Eco Bag', 'Sunset Koala Eco Bag', 'Rainbow Koala Eco Bag'];
    for (const bagName of bagsToDelete) {
      await conn.query('DELETE FROM products WHERE name = ?', [bagName]);
      console.log(`✓ ${bagName} 已删除`);
    }
    console.log();

    // 添加新 eco bag
    const newBag = {
      name: 'Queen BB Koala Eco Bag - Royal',
      slug: 'queen-bb-koala-eco-bag-royal',
      description: 'Premium organic cotton eco bag featuring Queen BB koala with royal crown and elegant dress design. Perfect for everyday use and special occasions.',
      shortDescription: 'Canvas tote bag with Queen BB koala royal design',
      categoryId: 30001, // Eco Bags
      price: 25.00,
      imageUrl: '/manus-storage/IMG_0774_7de087b7.JPG',
      stock: 100,
      productType: 'merchandise',
      isActive: 1
    };

    await conn.query(
      'INSERT INTO products (name, slug, description, shortDescription, categoryId, price, imageUrl, stock, productType, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newBag.name, newBag.slug, newBag.description, newBag.shortDescription, newBag.categoryId, newBag.price, newBag.imageUrl, newBag.stock, newBag.productType, newBag.isActive]
    );

    console.log('✓ Queen BB Koala Eco Bag - Royal 已添加\n');
    console.log('✅ 更新完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

updateEcobags();
