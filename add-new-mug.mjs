import mysql from 'mysql2/promise';

async function addNewMug() {
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

    // 添加新 mug
    const newMug = {
      name: 'Queen BB Koala Mug - Red X',
      slug: 'queen-bb-koala-mug-red-x',
      description: 'Premium ceramic mug featuring Queen BB koala with red X design. Perfect for your morning coffee or tea.',
      shortDescription: 'Ceramic mug with Queen BB koala design',
      categoryId: 1, // Mugs
      price: 35.90,
      imageUrl: '/manus-storage/IMG_0765_be991290.jpg',
      stock: 0, // marked as sold out
      productType: 'merchandise',
      isActive: 1
    };

    await conn.query(
      'INSERT INTO products (name, slug, description, shortDescription, categoryId, price, imageUrl, stock, productType, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newMug.name, newMug.slug, newMug.description, newMug.shortDescription, newMug.categoryId, newMug.price, newMug.imageUrl, newMug.stock, newMug.productType, newMug.isActive]
    );

    console.log('✓ Queen BB Koala Mug - Red X 已添加并标记为 sold out\n');
    console.log('✅ 添加完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

addNewMug();
