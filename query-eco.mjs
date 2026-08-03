import mysql from 'mysql2/promise';

async function queryEco() {
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
    
    const [eco] = await conn.query(`
      SELECT id, name, price, stock FROM products 
      WHERE categoryId = (SELECT id FROM categories WHERE name = 'Eco Bags')
      ORDER BY id DESC
    `);
    
    console.log('现有 Eco Bags:');
    eco.forEach(e => {
      console.log(`  ID: ${e.id}, 名称: ${e.name}, 价格: $${e.price}, 库存: ${e.stock}`);
    });
    
  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

queryEco();
