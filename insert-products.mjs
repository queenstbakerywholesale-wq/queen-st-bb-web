import mysql from 'mysql2/promise';

async function insertProducts() {
  let conn;
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('DATABASE_URL not set');
      process.exit(1);
    }

    const url = new URL(dbUrl);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {},
    };

    console.log('连接到数据库:', config.host);
    conn = await mysql.createConnection(config);
    console.log('✓ 数据库连接成功\n');

    const [ecoCategories] = await conn.query('SELECT id FROM categories WHERE name = ?', ['Eco Bags']);
    if (!ecoCategories || ecoCategories.length === 0) {
      console.error('❌ 未找到 Eco Bags 分类');
      return;
    }
    const ecoCategoryId = ecoCategories[0].id;
    console.log(`✓ Eco Bags 分类 ID: ${ecoCategoryId}`);

    const [mugCategories] = await conn.query('SELECT id FROM categories WHERE name = ?', ['Mugs']);
    if (!mugCategories || mugCategories.length === 0) {
      console.error('❌ 未找到 Mugs 分类');
      return;
    }
    const mugCategoryId = mugCategories[0].id;
    console.log(`✓ Mugs 分类 ID: ${mugCategoryId}\n`);

    const ecoBags = [
      {
        name: 'Party Koala Eco Bag',
        slug: 'party-koala-eco-bag-' + Date.now(),
        description: 'Celebrate in style with our playful Party Koala eco bag. Features a charming koala illustration with party hat and cake, perfect for special occasions and everyday use.',
        shortDescription: 'Organic cotton eco bag with screen-printed Party Koala design',
        categoryId: ecoCategoryId,
        price: '35.90',
        imageUrl: '/manus-storage/ecobag-party-koala_a8354d99.png',
        stock: 100,
      },
      {
        name: 'Rainbow Koala Eco Bag',
        slug: 'rainbow-koala-eco-bag-' + Date.now(),
        description: 'Brighten your day with our vibrant Rainbow Koala eco bag. Features a cheerful koala surrounded by rainbow colors, perfect for adding a pop of color to your daily routine.',
        shortDescription: 'Organic cotton eco bag with colorful Rainbow Koala design',
        categoryId: ecoCategoryId,
        price: '28.00',
        imageUrl: '/manus-storage/ecobag-rainbow-koala_a8354d99.png',
        stock: 80,
      },
      {
        name: 'Sunset Koala Eco Bag',
        slug: 'sunset-koala-eco-bag-' + Date.now(),
        description: 'Carry your essentials in style with our Sunset Koala eco bag. Features a serene koala silhouette against a beautiful sunset backdrop, perfect for nature lovers.',
        shortDescription: 'Organic cotton eco bag with Sunset Koala design',
        categoryId: ecoCategoryId,
        price: '32.00',
        imageUrl: '/manus-storage/ecobag-sunset-koala_a8354d99.png',
        stock: 90,
      },
    ];

    console.log('📦 插入 Eco Bags:');
    for (const bag of ecoBags) {
      const [result] = await conn.query(
        `INSERT INTO products (name, slug, description, shortDescription, categoryId, price, imageUrl, stock, isActive, isFeatured, productType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [bag.name, bag.slug, bag.description, bag.shortDescription, bag.categoryId, bag.price, bag.imageUrl, bag.stock, true, false, 'merchandise']
      );
      console.log(`  ✓ ${bag.name}`);
    }

    const mugs = [
      {
        name: 'Minimalist White Mug',
        slug: 'minimalist-white-mug-' + Date.now(),
        description: 'A clean and elegant white ceramic mug perfect for your morning coffee. Features a minimalist design that complements any kitchen aesthetic.',
        shortDescription: 'Stackable ceramic mug, minimalist white design',
        categoryId: mugCategoryId,
        price: '38.00',
        imageUrl: '/manus-storage/mug-minimalist-white_a8354d99.jpg',
        stock: 120,
      },
      {
        name: 'Terracotta Earth Mug',
        slug: 'terracotta-earth-mug-' + Date.now(),
        description: 'Warm and earthy terracotta ceramic mug inspired by natural clay. Perfect for tea lovers who appreciate organic aesthetics.',
        shortDescription: 'Stackable ceramic mug, terracotta earth design',
        categoryId: mugCategoryId,
        price: '36.50',
        imageUrl: '/manus-storage/mug-terracotta-earth_a8354d99.jpg',
        stock: 100,
      },
      {
        name: 'Charcoal Grey Mug',
        slug: 'charcoal-grey-mug-' + Date.now(),
        description: 'Sophisticated charcoal grey ceramic mug with a modern aesthetic. Ideal for those who prefer a contemporary look with timeless appeal.',
        shortDescription: 'Stackable ceramic mug, charcoal grey design',
        categoryId: mugCategoryId,
        price: '37.00',
        imageUrl: '/manus-storage/mug-charcoal-grey_a8354d99.jpg',
        stock: 110,
      },
    ];

    console.log('\n📦 插入 Mugs:');
    for (const mug of mugs) {
      const [result] = await conn.query(
        `INSERT INTO products (name, slug, description, shortDescription, categoryId, price, imageUrl, stock, isActive, isFeatured, productType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [mug.name, mug.slug, mug.description, mug.shortDescription, mug.categoryId, mug.price, mug.imageUrl, mug.stock, true, false, 'merchandise']
      );
      console.log(`  ✓ ${mug.name}`);
    }

    console.log('\n✅ 所有产品插入成功！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

insertProducts();
