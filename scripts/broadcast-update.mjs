import "dotenv/config";

const message = process.argv.slice(2).join(" ").trim();
const appUrl = process.env.APP_URL;
const secret = process.env.UPDATE_BROADCAST_SECRET;

if (!appUrl || !secret || !message) {
  console.error("Usage: APP_URL=https://your-app.vercel.app UPDATE_BROADCAST_SECRET=... npm run notify:update -- \"Update text\"");
  process.exit(1);
}

const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/telegram/broadcast`, {
  body: JSON.stringify({
    message,
    title: "Finanzmanager Update"
  }),
  headers: {
    "Content-Type": "application/json",
    "x-broadcast-secret": secret
  },
  method: "POST"
});

const body = await response.text();

if (!response.ok) {
  console.error(body);
  process.exit(1);
}

console.log(body);
