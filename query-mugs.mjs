import mysql from 'mysql2/promise';

async function queryMugs() {
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
    
    // 查询 Mugs 分类的所有产品
    const [mugs] = await conn.query(`
      SELECT id, name, price, stock FROM products 
      WHERE categoryId = (SELECT id FROM categories WHERE name = 'Mugs')
      ORDER BY id DESC
    `);
    
    console.log('现有 Mugs:');
    mugs.forEach(m => {
      console.log(`  ID: ${m.id}, 名称: ${m.name}, 价格: $${m.price}, 库存: ${m.stock}`);
    });
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

queryMugs();
