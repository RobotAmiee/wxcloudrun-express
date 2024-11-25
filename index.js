const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { init: initDB, Counter } = require("./db");
const axios = require("axios");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  console.log("req:", req);
  console.log("res:", res);
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  console.log("req:", req);
  console.log("res:", res);
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

app.post("/api/send-template", async (req, res) => {
  console.log("========req:", req);
  const { openid, template_id, url, data, miniprogram } = req.body;

  if (!openid || !template_id || !data) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    // const token = await getAccessToken();
    // const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`;
    const apiUrl = "https://api.weixin.qq.com/cgi-bin/message/template/send";

    console.log("========apiUrl:", apiUrl);


    const payload = {
      touser: openid,
      template_id,
      url, // 模板跳转链接，可选
      data, // 模板数据
      miniprogram, // 模板跳转小程序，可选
    };

    console.log("========payload:", payload);

    console.log("========axios:", axios);

    const response = await axios.post(apiUrl, payload);
    console.log("========response:", response);

    const result = response.data;
    console.log("========result:", result);


    if (result.errcode === 0) {
      res.send({ success: true, msgid: result.msgid });
    } else {
      res.status(500).send({ success: false, errmsg: result.errmsg });
    }
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
