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