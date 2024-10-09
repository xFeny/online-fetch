const express = require("express");
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

// 使用body-parser中间件解析JSON类型的请求体
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get("/", (req, res) => res.send("Hello Express"));
app.post("/", (req, res) => res.send("Hello Express"));

// 发送http请求
app.post("/httpRequest", (req, res) => {

    // 获取POST请求体中的数据
    let { url, method, headers, params, contentType } = req.body;

    headers = headers ? JSON.parse(headers) : {}
    params = params ? JSON.parse(params) : {}
    console.log(headers, params)

    axios({
        url,
        method,
        headers: {
            'Content-Type': contentType,
            ...headers
        },
        data: contentType.includes('application/json') ? params : new URLSearchParams(params)
    }).then(function (response) {
        res.json(response.data)
    }).catch(function (error) {
        if (error.response) {
            res.json(error.response.data)
        } else {
            let { status, message } = error
            res.json({ code: status, message })
        }
    })
});


app.listen(3000, () => console.log("Server ready on port 3000."));

exports.app = app;