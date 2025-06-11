### 一、web环境搭建

#### 1.安装基础组件包

```bash
dnf install -y epel-release
dnf install -y nodejs npm nginx mysql-server

# 可能情况：出现npm版本过低问题
# 升级后：node : v10.24.0 >> v18.20.8 ; npm : 6.14.11 >> 10.8.2
# dnf remove nodejs -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install -y nodejs
```

##### - mysql

登入mysql后，设置 `root` 密码 `123456` 。

```sql
修改通过root用户登录数据库的密码;
创建全域root用户，允许root用户通过密码123456从任何主机连接到MySQL服务器;
授权root用户拥有数据库中的所有权限，并刷新MySQL的权限表，使授权生效;
更新生效;
alter user 'root'@'localhost' identified by "123456";
create user 'root'@'%' identified by '123456';
grant all privileges on *.* to 'root'@'%';
flush privileges;
```

创建 `web应用` 所用的数据库，数据库 `webapp` 。

```sql
create database webapp;
```

（可选）`mysql -uroot -p webapp < users.sql`

##### - nginx

配置 `conf` 参数文件，路径 `/etc/nginx/conf.d/` ，创建 `webapp.conf` ，内容如下：

> "192.168.255.130"是笔者的实验环境中的IP，请读者根据自己环境情况自行更改。

```java
server {
    listen 80;
    server_name 192.168.255.130;

    root /data/attack_and_defense/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 转发 API 请求（保持方法、头部、请求体）
    location /login {
        proxy_pass http://127.0.0.1:3002;
    }

    location /setContent {
        proxy_pass http://127.0.0.1:3002;
    }

    location /content {
        proxy_pass http://127.0.0.1:3002;
    }

    # 强制所有文本类型使用 UTF-8 编码
    # charset utf-8;
}
```

##### - nodejs

在该web项目目录下，npm安装依赖包：

```bash
npm install express mysql2 escape-html
```



#### 2. 目录结构

```bash
[root@meowser-AAD attack_and_defense]# tree -I node_modules
.
├── public （前端静态资源）
│   ├── css
│   │   └── style.css
│   ├── index.html （前端入口）
│   └── js （前端逻辑）
│       ├── main.js
│       ├── sql.js
│       └── xss.js
├── models （后端数据库模块）
│   ├── db.js
│   └── init.js
├── routes （后端路由模块）
│   ├── sql.js
│   └── xss.js
├── server.js （后端服务器入口）
└── sql
    └── users.sql
```



#### 3. 相关代码文件

##### /public/index.html

```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <!--  Nyaciao~ (∠・ω< )⌒☆   -->
    <title>Nyaciao&#126; &lpar;∠・ω&lt; &rpar;⌒☆ </title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <aside class="sidebar">
            <h2>功能导航</h2>
            <ul>
                <li onclick="showModule('xss')">XSS 注入</li>
                <li onclick="showModule('sql')">SQL 注入</li>
            </ul>
        </aside>
        <main class="content">
            <!-----------------------xss----------------------------------->
            <div id="xss-module" class="module">
                <h2>XSS 注入测试</h2>
                <label>选择安全级别：</label>
                <select id="securityLevel">
                    <option value="low">Low</option>
                    <option value="high">High</option>
                </select>
                <br><br>
                <input id="input1" placeholder="请输入内容" />
                <button onclick="xss_func()">提交</button>
                <div id="displayArea"></div>
            </div>
            <!-----------------------sql----------------------------------->
            <div id="sql-module" class="module" style="display: none;">
                <h2>SQL 注入测试</h2>
                <label for="level">安全级别：</label>
                <select id="level">
                    <option value="low">低（可注入）</option>
                    <option value="high">高（防注入）</option>
                </select><br><br>
                <input id="input2" placeholder="用户名"/>
                <input id="input3" placeholder="密码"/>
                <button onclick="sql_func()">提交</button>
                <div id="userInfo"></div>
            </div>
        </main>
    </div>

    <script src="js/main.js"></script>
    <script src="js/xss.js"></script>
    <script src="js/sql.js"></script>

</body>
</html>
```



##### /public/js/main.js

```javascript
function showModule(name) {
    document.getElementById('xss-module').style.display = 'none';
    document.getElementById('sql-module').style.display = 'none';

    //--这里是添加新功能的部分，根据以下参考按需自行修改添加，详见ADDNEW.md帮助文档
    /*
    document.getElementById('New01-module').style.display = 'none';
    document.getElementById('New02-module').style.display = 'none';
    document.getElementById('New03-module').style.display = 'none';
    */

    document.getElementById(`${name}-module`).style.display = 'block';
}
```



##### /public/js/sql.js

```javascript
function sql_func(){
    const username = document.getElementById('input2').value;
    const password = document.getElementById('input3').value;
    const level = document.getElementById('level').value;

    fetch('/login', {
        headers: {
            "content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({ username, password, level }),
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.userInfo) {
            document.getElementById('userInfo').innerHTML = `用户信息: ${JSON.stringify(data.userInfo)}`;
        }
    });
}
```



##### /public/xss.js

```javascript
function xss_func(){
    var content = document.getElementById('input1').value;
    const level = document.getElementById('securityLevel').value;

    document.getElementById('displayArea').innerHTML = content;

    fetch('/setContent',{
        headers: { "content-Type": "application/json" },
        method:"POST",
        body: JSON.stringify({ content, level }),
    }).then(() => {
        // 显示点击跳转链接
        const linkHtml = `<p>提交成功！点击跳转 <a href="http://192.168.255.130/content" target="_blank">/content标签界面</a></p>`;
        document.getElementById('displayArea').insertAdjacentHTML('beforeend', linkHtml);
    });
}
```



##### /public/css/style.css

```css
body {
    margin: 0;
    font-family: sans-serif;
}

.container {
    display: flex;
    height: 100vh;
}

.sidebar {
    width: 200px;
    background-color: #2c3e50;
    color: white;
    padding: 1em;
}

.sidebar ul {
    list-style: none;
    padding: 0;
}

.sidebar li {
    padding: 0.5em 0;
    cursor: pointer;
}

.sidebar li:hover {
    background-color: #34495e;
}

.content {
    flex: 1;
    padding: 2em;
    background-color: #f5f5f5;
}

.module {
    display: block;
}
```



##### /models/db.js

```javascript
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
```



##### /models/init.js

```javascript
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
```



##### /routes/sql.js

```javascript
const db = require('../models/db');

module.exports = (app) => {
    app.post('/login', async (req, res) => {
        try {
            const { username, password, level } = req.body;

            let results;

            if (level === 'low') {
                // [x]不安全写法，模拟注入
                const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
                console.log('[LOW] SQL:', sql);
                [results] = await db.query(sql); // 非参数化
            } else {
                // [v]安全写法，参数化查询
                const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
                console.log('[HIGH] SQL:', sql);
                console.log(`[HIGH] PARAMS: username = ${username}, password = ${password}`);
                [results] = await db.execute(sql, [username, password]);
            }

            if (results.length > 0) {
                res.json({
                    message: "登录成功",
                    userInfo: results
                });
            } else {
                res.json({
                    message: "登录失败",
                    userInfo: "登录失败无法查询"
                });
            }
            console.log(results);
        } catch (err) {
            console.error(err);
            res.status(500).send("查询错误");
        }
    });
};

```



##### /routes/xss.js

```javascript
//---------------------xss---------------------------------
const escapeHtml = require('escape-html');

let content = "";

module.exports = (app) => {
    app.get("/content", (req, res) => {
        res.send(content);
    });

    app.post('/setContent', (req, res) => {
        const { content: rawContent, level } = req.body;

        if (level === 'high') {
            content = escapeHtml(rawContent); // 高级别 => 进行转义
        } else {
            content = rawContent; // 低级别 => 原样保存（不安全）
        }

        res.send("OK");
    });
};
```



##### /server.js

```javascript
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

initializeDatabase();

// 启动服务
const port = 3002;
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});

```



##### /sql/users.sql

```sql
CREATE TABLE IF NOT EXISTS users (
    student_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(50),
    age INT,
    email VARCHAR(100)
);

INSERT IGNORE INTO users (student_id, username, password, name, age, email)
VALUES ('2023001', 'alice', 'al123456', 'Alice Wang', 20, 'alice@example.com'),
       ('2023002', 'zs', '123456', 'San Zhang', 25, 'zhangsa@example.com'),
       ('2023003', 'lisi', '123456', 'Si Li', 18, 'lisi@example.com'),
       ('2023004', 'bob', 'bo123456', 'Bob Wang', 22, 'bob@example.com');
```

#### 4.启动web应用，界面截图

启动web应用：

```bash
cd /data/Attack_And_Defense

systemctl restart mysqld nginx
node server.js
```



![image-20250611235404546](/MD_assets/image-20250611235404546.png)

### 二、攻击测试与防御

#### XSS注入

漏洞存在位置：`/routes/xss.js`

漏洞描述：直接将用户输入的 `rawContent` 赋值给网页内容，该做法会导致用户输入的任意 HTML 和 JavaScript 代码被直接执行。

```javascript
content = rawContent;
```

攻击语句：

 对于xss注入有：`<script>while(1)alert(1)</script>`

> 点击提交后，跳转至content/页，发现无限弹出标题为"1"的提示框。

防御手段：

使用 `escape-html` 库，对所有用户输入内容进行 HTML 转义，避免标签和脚本执行。

```javascript
content = escapeHtml(rawContent);
```



#### SQL注入

漏洞存在位置：`/routes/sql.js`

漏洞描述：不安全代码使用字符串拼接构建 SQL 查询，导致 SQL 语句逻辑错误，绕过身份验证。

```javascript
const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
```

攻击语句：

 对于sql注入有：`' or'1' = '1`

>显示登录成功，页面回显该数据库中全部数据。

防御手段：

使用预处理语句，避免直接拼接字符串，参数自动转义。

```javascript
const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
```



#### nginx+nodejs 前后端分离架构

可能存在风险：

- **直接访问 Node.js 端口绕过 Nginx**：用户直接访问 `3002` 端口可能绕过 Nginx 的安全控制，如防火墙、CORS 策略、HTTPS 强制等。

- **未对 Node.js 服务进行访问限制**：暴露端口导致暴力攻击、DOS 攻击风险。

攻击效果：

- 绕过安全策略，直接发送恶意请求。

- 发现更多内部服务信息，增加攻击面。

- 可能导致服务不稳定或被攻击者利用。

防御手段：

- **限制 Node.js 监听地址**，只监听 `127.0.0.1`，不暴露外网端口。

  在 `server.js` 中：

  ```javascript
  app.listen(port,`127.0.0.1` , () => {
      console.log(`服务器运行在 http://localhost:${port}`);
  });
  ```

  

- **通过 iptables 规则**限制外部访问 Node.js 端口，只允许本机访问。

  ```bash
  # 允许本机访问（lo 是 loopback）
  # 拒绝其他所有来源访问 3002（可以直接 DROP 或 REJECT）
  
  sudo iptables -A INPUT -p tcp -s 127.0.0.1 --dport 3002 -j ACCEPT
  sudo iptables -A INPUT -p tcp --dport 3002 -j REJECT
  ```

  

- **所有请求必须通过 Nginx 反向代理**，利用 Nginx 配置 CSP、限流、HTTPS。

  配置反向代理

  ```java
          proxy_pass http://127.0.0.1:3002/;  # 反向代理到Node.js
  ```

  添加安全头

  ```java
  # 添加安全头
  add_header Content-Security-Policy "default-src 'self'; script-src 'self';";
  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  ```



#### 总结表格

| 漏洞类型     | 关键风险                 | 推荐防护措施                                                 |
| ------------ | ------------------------ | ------------------------------------------------------------ |
| XSS          | 脚本注入导致信息泄露     | HTML 输出编码                                                |
| SQL注入      | 身份绕过、数据泄露/破坏  | 预处理语句                                                   |
| 架构安全风险 | 端口暴露导致安全策略绕过 | Node.js 仅监听本地，iptables限制端口，Nginx 反向代理代理访问 |

### 三、“ADDNEW”添加新功能测试页

在 `public/index.html` 、`public/main.js`、`server.js`中，

带有 ` <!--这里是添加新功能的部分，根据以下参考按需自行修改添加，详见README.md帮助文档-->`  字样部分，取消对应部分字段的注释，即可使用，然后在其中自行编写漏洞测试逻辑功能，进行测试。在该项目文件中，预先放置了三个，如果数量不够使用，可以自行在后面添加。

例如，`AddNew01`  ，想要做一个文件上传漏洞的功能。

那么把 `public/index.html` 、`public/main.js`、`server.js`中关于`AddNew01`相关的注释取消掉，进行增添修改。

在 `public/js/AddNew01.js` 中编写前端逻辑。

在 `routes/AddNew01.js`  中编写后端逻辑。





---

### 四、模块化前的版本（旧）

#### - 目录结构：

```bash
[root@meowser-AAD attack_and_defense]# tree -I node_modules
.
├── public
│   └── index.html
├── server.js
└── sql
    └── users.sql
```

#### - index.html:

```html
<!DOCTYPE html>

<!-- xss注入部分 -->
<h1>XSSSSS</h1>
<input id="input1"/><button onclick="xss_func()">提交</button>
<div id="displayArea">
    </div>

<script>
   function xss_func(){
        var content = document.getElementById('input1').value
        document.getElementById('displayArea').innerHTML = content; //把用户输出的内容显示在页面上
        fetch('/setContent',{
            headers:{
                "content-Type": "application/json"
            },
            method:"POST",
            body:JSON.stringify({content}),
        }).then(res=>{
        })
}
</script>

<!-- SQL注入部分 -->
<h1>SQL</h1>
<input id="input2" placeholder="用户名"/>
<input id="input3" placeholder="密码"/>
<button onclick="sql_func()">提交</button>
<div id="userInfo"></div>

<script>
    function sql_func(){
        var username = document.getElementById('input2').value;
        var password = document.getElementById('input3').value;
        fetch('/login', {
            headers: {
                "content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({ username, password }),
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message); // 显示登录成功或失败的消息
            if (data.userInfo) { // 如果有用户信息，显示在页面上
                const userInfoDiv = document.getElementById('userInfo');
                // 将用户信息转化为字符串
                userInfoDiv.innerHTML = `用户信息: ${JSON.stringify(data.userInfo)}`;
            }
        });
    }
</script>
```

#### - server.js:

```javascript
const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');

const app = express();

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 引入入侵检测插件
// const detectInjection = require('./plugins/InjectionDetection');
// app.use(detectInjection);

// 提供静态文件
app.use(express.static('public'));

//---------------------xss---------------------------------
let content = "";
app.get("/content", (req, res) => {
    res.send(content);
});

app.post('/setContent', (req, res) => {
    content = req.body.content;
    res.send("OK");
});

//---------------------sql---------------------------------

// 连接 MySQL 数据库（数据库名为 webapp）
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'webapp',
    multipleStatements: true // 允许一次执行多个 SQL 语句
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL database.');

    // 读取 SQL 文件内容
    const sqlFilePath = './sql/users.sql';
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    db.query(sqlContent, (err) => {
        if (err) {
            console.error('Error executing SQL script:', err.message);
        } else {
            console.log('Database initialized with users table and data.');
        }
    });
});

// 登录逻辑
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    // const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';

    console.log(sql);

    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.log(err);
            res.send("查询错误");
            return;
        }

        console.log(results);

        if (results.length > 0) {
            res.json({
                message: "登录成功",
                userInfo: results
            });
        } else {
            res.json({
                message: "登录失败",
                userInfo: "登录失败无法查询"
            });
        }
    });
});

// 启动服务
const port = 3002;
app.listen(port, '127.0.0.1', () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});

```

#### - users.sql:

```sql
CREATE TABLE IF NOT EXISTS users (
    student_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(50),
    age INT,
    email VARCHAR(100)
);

INSERT IGNORE INTO users (student_id, username, password, name, age, email)
VALUES ('2023001', 'alice', 'al123456', 'Alice Wang', 20, 'alice@example.com'),
       ('2023002', 'zs', '123456', 'San Zhang', 25, 'zhangsa@example.com'),
       ('2023003', 'lisi', '123456', 'Si Li', 18, 'lisi@example.com'),
       ('2023004', 'bob', 'bo123456', 'Bob Wang', 22, 'bob@example.com');
```

#### - webapp.conf: 

```java
server {
    listen 80;
    server_name 192.168.255.130;

    root /data/attack_and_defense/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 转发 API 请求（保持方法、头部、请求体）
    location /login {
        proxy_pass http://127.0.0.1:3002;
    }

    location /setContent {
        proxy_pass http://127.0.0.1:3002;
    }

    location /content {
        proxy_pass http://127.0.0.1:3002;
    }

    # 强制所有文本类型使用 UTF-8 编码
    # charset utf-8;
}
```



