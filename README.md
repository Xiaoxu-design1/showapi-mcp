# showapi-mcp

把**易源开放平台(ShowAPI)** 的「查快递 + 个人生活服务」接口封装成 **MCP Server**(Streamable HTTP)。
可在 **RikkaHub(安卓手机) / Claude Desktop / Cursor** 等支持远程 MCP 的客户端里直接添加使用。

## 提供哪些工具

| 工具名 | 作用 |
| --- | --- |
| `query_express` | 查快递物流轨迹，参数 `com`(快递公司编码) + `nu`(运单号) |
| `showapi_call` | 通用调用易源**任意已开通接口**(生活服务等)，参数 `api_url` + `params` |

> 快递公司编码对照表(常用): `sf` 顺丰 / `zhongtong` 中通 / `yuantong` 圆通 / `yunda` 韵达 / `jd` 京东 / `sto` 申通 / `ems` EMS。完整对照表请看易源「快递查询」接口文档的 com 说明。

---

## 你需要准备的 3 样东西

1. **易源账号**：到 [showapi.com](https://www.showapi.com) 注册 + 实名认证。
2. **接口凭证**：个人中心 → 我的应用 → 拿到 `showapi_appid` 和 `showapi_secret`。
3. **开通接口**：在 API 市场开通「快递查询」(免费版即可)，其他生活服务接口按需开通。

---

## 方式 A: 免费部署到云端(RikkaHub 推荐，全手机可操作)

### 1. 部署到 Railway(推荐，免费额度够用)

1. 手机浏览器打开 [railway.app](https://railway.app)，用 **GitHub 账号登录**(就是本项目所在的账号)。
2. 点 **New Project → Deploy from GitHub repo**，选择 `showapi-mcp`。
3. 进项目 → **Variables**，添加两个变量：
   - `SHOWAPI_APPID` = 你的 showapi_appid
   - `SHOWAPI_SECRET` = 你的 showapi_secret
4. Railway 会自动 `npm install && npm start`，稍等部署完成。
5. 点 **Settings → Networking → 生成 Public Networking 域名**(如 `https://xxx.up.railway.app`)。
6. 你的 MCP 地址就是：`https://xxx.up.railway.app/mcp`

### 2. 备用: 部署到 Render

1. 打开 [render.com](https://render.com) → GitHub 登录。
2. **New + → Web Service** → 选本仓库。
3. Build Command: `npm install`，Start Command: `npm start`。
4. 在 **Environment** 里加 `SHOWAPI_APPID` / `SHOWAPI_SECRET`。
5. 部署完成后地址形如 `https://xxx.onrender.com`，MCP 地址加 `/mcp`。

---

## 方式 B: 本地运行(电脑可用时)

```bash
npm install
SHOWAPI_APPID=你的appid SHOWAPI_SECRET=你的secret npm start
```

本机 MCP 地址: `http://localhost:3000/mcp`

---

## 在 RikkaHub 里添加(手机上)

1. 打开 RikkaHub → **设置** → **MCP**。
2. 点 **添加 MCP**，类型选 **Streamable HTTP**(或「远程/URL」)。
3. 填名称(如 `易源快递`) + **URL**: `https://你的域名/mcp`。
4. 保存后应能识别出工具 `query_express` / `showapi_call`。
5. 新建对话，直接说:
   - 「帮我查中通快递 75312165465979」
   - 「查一下 13812345678 的归属地」(需先开通归属地接口，走 `showapi_call`)

---

## 环境变量说明

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `SHOWAPI_APPID` | 是 | 易源应用ID |
| `SHOWAPI_SECRET` | 是 | 易源应用密钥 |
| `SHOWAPI_EXPRESS_URL` | 否 | 快递接口地址，默认 `https://route.showapi.com/64-19` |
| `PORT` | 否 | 服务端口，默认 3000 |

---

## 常见问题

- **提示缺少凭证**: 没配 `SHOWAPI_APPID`/`SHOWAPI_SECRET`，在部署平台 Variables 里加上。
- **接口报签名/权限错误**: 确认已在易源开通对应接口，且 appid/secret 正确。
- **MCP 连不上**: 确认部署平台已生成公网域名，且 URL 以 `/mcp` 结尾。

---

> 提示: 易源部分接口按次计费，开通前注意看价格与免费额度。
