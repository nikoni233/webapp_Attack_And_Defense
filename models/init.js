const fs = require('fs');
const db = require('./db');

async function initializeDatabase() {
    try {
        console.log('Connecting to MySQL database...');
        const connection = await db.getConnection();  // 获取连接（mysql2/promise 接口）

        const sqlFilePath = './sql/users.sql';
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        await connection.query(sqlContent);
        console.log('Database initialized with users table and data.');

        connection.release(); // 释放连接
    } catch (err) {
        console.error('Error during database initialization:', err.message);
    }
}

module.exports = initializeDatabase;
