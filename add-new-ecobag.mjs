import mysql from 'mysql2/promise';

async function addEcoBag() {
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

    const [ecoCategories] = await conn.query('SELECT id FROM categories WHERE name = ?', ['Eco Bags']);
    const ecoCategoryId = ecoCategories[0].id;

    const newBag = {
      name: 'Birthday Cake Koala Eco Bag',
      slug: 'birthday-cake-koala-ecobag-' + Date.now(),
      description: 'Celebrate in style with our charming Birthday Cake Koala eco bag. Features a hand-drawn illustration of a happy koala holding a birthday cake with a candle. Perfect for special occasions and everyday use.',
      shortDescription: 'Organic cotton eco bag with Birthday Cake Koala design',
      categoryId: ecoCategoryId,
      price: '25.00',
      imageUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/birthday-cake-koala-ecobag-CzQsARfA6jpCGq7fRYNNna.webp',
      stock: 100,
    };

    const [result] = await conn.query(
      `INSERT INTO products (name, slug, description, shortDescription, categoryId, price, imageUrl, stock, isActive, isFeatured, productType, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [newBag.name, newBag.slug, newBag.description, newBag.shortDescription, newBag.categoryId, newBag.price, newBag.imageUrl, newBag.stock, true, false, 'merchandise']
    );

    console.log(`✅ 新产品已添加: ${newBag.name} (ID: ${result.insertId})`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

addEcoBag();
