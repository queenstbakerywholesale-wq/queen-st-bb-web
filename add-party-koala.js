const mysql = require('mysql2/promise');

async function addProduct() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'queen_st_bb',
    });

    const [categories] = await conn.query('SELECT id FROM categories WHERE name = ? LIMIT 1', ['Eco Bags']);
    
    if (!categories || categories.length === 0) {
      console.error('Eco Bags category not found');
      return;
    }

    const categoryId = categories[0].id;
    console.log(`Found Eco Bags category ID: ${categoryId}`);

    const slug = 'party-koala-eco-bag-' + Date.now();

    const [result] = await conn.query(
      `INSERT INTO products (
        name, slug, description, shortDescription, categoryId, price, 
        imageUrl, stock, isActive, isFeatured, productType, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'Party Koala Eco Bag',
        slug,
        'Celebrate in style with our playful Party Koala eco bag. Features a charming koala illustration with party hat and cake, perfect for special occasions and everyday use.',
        'Organic cotton eco bag with screen-printed Party Koala design',
        categoryId,
        '35.90',
        '/manus-storage/ecobag-party-koala_a8354d99.png',
        100,
        true,
        false,
        'merchandise'
      ]
    );

    console.log(`Product added successfully! ID: ${result.insertId}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

addProduct();
