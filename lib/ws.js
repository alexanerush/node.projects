import { WebSocketServer } from "ws";

const subscribedArticleByClient = new Map();
let wss = null;

export function setupWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    subscribedArticleByClient.set(ws, null);

    ws.on("message", (buf) => {
      try {
        const data = JSON.parse(buf.toString());
        if (data?.type === "SUBSCRIBE" && data.articleId) {
          subscribedArticleByClient.set(ws, String(data.articleId));
        }
      } catch {
        // ignore
      }
    });

    ws.on("close", () => {
      subscribedArticleByClient.delete(ws);
    });
  });

  return wss;
}

export function notifyArticle(articleId, payload) {
  if (!wss) return;

  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    const sub = subscribedArticleByClient.get(client);
    if (sub === String(articleId)) client.send(msg);
  }
}
