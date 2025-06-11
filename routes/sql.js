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
