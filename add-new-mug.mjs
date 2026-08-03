import mysql from 'mysql2/promise';

function generateSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

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

    // 获取 Mugs 分类 ID
    const [categories] = await conn.query('SELECT id FROM categories WHERE name = ?', ['Mugs']);
    const mugsCategory = categories[0];
    if (!mugsCategory) {
      throw new Error('Mugs 分类不存在');
    }

    console.log('📦 添加新 Mug 产品...');
    
    // 添加新 mug
    await conn.query(`
      INSERT INTO products (
        name, slug, shortDescription, description, price, imageUrl, 
        productType, categoryId, stock, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'Queen BB Koala Mug',
      generateSlug('Queen BB Koala Mug'),
      'Premium ceramic mug with Queen BB koala design',
      'Celebrate Queen BB with this beautiful ceramic mug featuring our signature koala design. Perfect for your morning coffee or tea. Made from high-quality ceramic with a comfortable handle.',
      35.90,
      '/manus-storage/IMG_0706_76f42cf5.JPG',
      'merchandise',
      mugsCategory.id,
      100
    ]);

    console.log('  ✓ Queen BB Koala Mug 已添加\n');
    console.log('✅ 新 Mug 产品已添加成功！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

addNewMug();
