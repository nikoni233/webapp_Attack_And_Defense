function showModule(name) {
    document.getElementById('xss-module').style.display = 'none';
    document.getElementById('sql-module').style.display = 'none';

    //--这里是添加新功能的部分，根据以下参考按需自行修改添加，详见README.md帮助文档
    /*
    document.getElementById('New01-module').style.display = 'none';
    document.getElementById('New02-module').style.display = 'none';
    document.getElementById('New03-module').style.display = 'none';
    */

    document.getElementById(`${name}-module`).style.display = 'block';
}
