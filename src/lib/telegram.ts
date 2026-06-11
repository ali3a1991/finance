export async function sendTelegramMessage(contact: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: contact,
      text
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Telegram message could not be sent.");
  }
}

export async function sendTelegramCode(contact: string, code: string) {
  await sendTelegramMessage(contact, `FyNest registration code: ${code}`);
}
