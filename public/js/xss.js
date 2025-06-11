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