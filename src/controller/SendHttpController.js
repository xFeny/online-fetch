const express = require("express");
const axios = require("axios");
const router = express.Router();
// 发送http请求
router.post("/httpRequest", (req, res) => {
  // 获取POST请求体中的数据
  let { url, method, headers, params, contentType } = req.body;

  if (url) {
    res.json("url 不能为空");
    return;
  }
  method = method ? method : "GET";
  headers = headers ? JSON.parse(headers) : {};
  params = params ? JSON.parse(params) : {};

  axios({
    url,
    method,
    headers: {
      "Content-Type":
        contentType || "application/x-www-form-urlencoded;charset=UTF-8",
      ...headers,
    },
    data: params,
    params: method === "GET" ? new URLSearchParams(params) : null,
  })
    .then(function (response) {
      res.json(response.data);
    })
    .catch(function (error) {
      console.log(error.message);
      if (error.response) {
        res.json(error.response.data);
      } else {
        let { status, message } = error;
        res.json({ code: status, message });
      }
    });
});

module.exports = router;
