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