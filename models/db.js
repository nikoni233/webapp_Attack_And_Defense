const mysql = require('mysql2');

// 连接 MySQL 数据库（数据库名为 webapp）
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'webapp',
    multipleStatements: true // 允许一次执行多个 SQL 语句
});

module.exports = pool.promise();  // 使用 promise 接口