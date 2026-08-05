import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL.split('@')[1].split('/')[0],
  user: process.env.DATABASE_URL.split('//')[1].split(':')[0],
  password: process.env.DATABASE_URL.split(':')[2].split('@')[0],
  database: process.env.DATABASE_URL.split('/').pop(),
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  const [result] = await connection.execute(
    'UPDATE products SET imageUrl = ? WHERE name = ?',
    ['/manus-storage/ChatGPTImageAug5,2026at07_38_34PM_95b44e91.png', 'Queen BB Koala Mug - Red X']
  );
  console.log('Updated Queen BB Koala Mug - Red X image:', result.affectedRows, 'rows');
} finally {
  await connection.end();
}
