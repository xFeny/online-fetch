const express = require("express");
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// 使用body-parser中间件解析JSON类型的请求体
app.use(bodyParser.json());
// 静态资源目录
app.use(express.static('public'));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const parentDir = path.resolve(__dirname, '..');
app.get("/", (req, res) => {
    res.sendFile(parentDir + '/public/example.html')
});


// 自动加载路由模块
const loadRoutes = (dir) => {
    const routesDir = path.join(__dirname, dir);
    const routeFiles = fs.readdirSync(routesDir);
    routeFiles.forEach((file) => {
        if (file.endsWith('.js')) {
            const routeModule = require(path.join(routesDir, file));
            console.log(file)
            app.use(routeModule);
        }
    });
};
loadRoutes('controller');

app.listen(3000, () => console.log("Server ready on port 3000."));

exports.app = app;