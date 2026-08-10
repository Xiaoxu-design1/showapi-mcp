import express from "express";
import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

// ============ 环境变量配置 ============
const APPID = process.env.SHOWAPI_APPID || "";          // 易源 showapi_appid
const SECRET = process.env.SHOWAPI_SECRET || "";        // 易源 showapi_secret
const EXPRESS_URL = process.env.SHOWAPI_EXPRESS_URL || "https://route.showapi.com/64-19"; // 快递接口
const PORT = Number(process.env.PORT) || 3000;

if (!APPID || !SECRET) {
  console.warn("[showapi-mcp] 警告: 未设置 SHOWAPI_APPID / SHOWAPI_SECRET，接口将返回缺少凭证错误。");
}

// ============ 易源 HTTP 调用 ============
// 认证方式与官方 SDK 一致: 直接把 showapi_secret 作为 showapi_sign 提交
async function callShowApi(apiUrl, params = {}) {
  if (!APPID || !SECRET) {
    return { error: "missing credentials", hint: "请先配置 SHOWAPI_APPID 与 SHOWAPI_SECRET 环境变量" };
  }
  const body = new URLSearchParams();
  body.set("showapi_appid", APPID);
  body.set("showapi_sign", SECRET);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) body.set(k, String(v));
  }
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: body.toString(),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { http_status: res.status, raw: text };
  }
}

// ============ MCP Server ============
const server = new McpServer({ name: "showapi-mcp", version: "1.0.0" });

// 工具1: 查快递
server.tool(
  "query_express",
  "查询快递物流轨迹(易源/ShowAPI)。com: 快递公司编码(如 zhongtong 中通 / sf 顺丰 / yuantong 圆通 / yunda 韵达 / jd 京东，完整对照表见易源快递接口文档); nu: 运单号",
  {
    com: { type: "string", description: "快递公司编码" },
    nu: { type: "string", description: "运单号" },
  },
  async ({ com, nu }) => {
    const data = await callShowApi(EXPRESS_URL, { com, nu });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// 工具2: 通用调用易源任意接口(个人生活服务等)
server.tool(
  "showapi_call",
  "通用调用易源(ShowAPI)任意已开通接口，用于个人生活服务等场景。api_url: 接口完整URL(如 https://route.showapi.com/xxx); params: 该接口的业务参数对象",
  {
    api_url: { type: "string", description: "易源接口完整URL，如 https://route.showapi.com/64-19" },
    params: { type: "object", description: "接口业务参数对象，如 {com:'zhongtong', nu:'运单号'}" },
  },
  async ({ api_url, params }) => {
    if (!api_url) return { content: [{ type: "text", text: "缺少 api_url 参数" }] };
    const data = await callShowApi(api_url, params || {});
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ============ HTTP 服务(Streamable HTTP Transport) ============
const app = express();
app.use(express.json());

// 宽松 CORS(方便调试，RikkaHub 原生端不受影响)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id, mcp-session-id, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const transports = new Map();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];
  let transport = transports.get(sessionId);
  if (!transport) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    await server.connect(transport);
    transports.set(transport.sessionId, transport);
  }
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    res.status(500).json({ error: String((err && err.message) || err) });
  }
});

app.get("/mcp", async (_req, res) => {
  res.status(200).json({ name: "showapi-mcp", status: "running", tools: ["query_express", "showapi_call"] });
});

app.get("/", (_req, res) => {
  res
    .type("text/plain; charset=utf-8")
    .send("showapi-mcp 运行中\n在 MCP 客户端(如 RikkaHub)添加本服务地址: <当前地址>/mcp");
});

app.listen(PORT, () => {
  console.log(`[showapi-mcp] http://0.0.0.0:${PORT}/mcp`);
});
