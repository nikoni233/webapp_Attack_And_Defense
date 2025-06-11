const express = require('express');
const app = express();

const initializeDatabase = require('./models/init');

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 提供静态文件
app.use(express.static('public'));

// 路由模块
require('./routes/xss')(app);
require('./routes/sql')(app);

//--这里是添加新功能的部分，根据以下参考按需自行修改添加，详见README.md帮助文档
/*
require('./routes/AddNew01')(app);
require('./routes/AddNew02')(app);
require('./routes/AddNew03')(app);
*/
// 初始化数据库
initializeDatabase();



// 启动服务
const port = 3002;
app.listen(port,`127.0.0.1` , () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
