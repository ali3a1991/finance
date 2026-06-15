import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";

const TABDEAL_SYMBOL = "USDTIRT";
const TABDEAL_BASE_URL = "https://api1.tabdeal.org/r/api/v1";

type DepthResponse = {
  asks?: string[][];
  bids?: string[][];
};

type TradeResponse = {
  price?: string;
  time?: number;
};

function parseMarketPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) ? price : null;
}

export async function GET(request: NextRequest) {
  const auth = requireApiAuth(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const [depthResponse, tradesResponse] = await Promise.all([
      fetch(`${TABDEAL_BASE_URL}/depth?symbol=${TABDEAL_SYMBOL}&limit=1`, { cache: "no-store" }),
      fetch(`${TABDEAL_BASE_URL}/trades?symbol=${TABDEAL_SYMBOL}&limit=1`, { cache: "no-store" })
    ]);

    if (!depthResponse.ok || !tradesResponse.ok) {
      return NextResponse.json({ message: "Tabdeal konnte den Tetherpreis nicht liefern." }, { status: 502 });
    }

    const depth = (await depthResponse.json()) as DepthResponse;
    const trades = (await tradesResponse.json()) as TradeResponse[];
    const lastTrade = trades[0];
    const bestAsk = parseMarketPrice(depth.asks?.[0]?.[0]);
    const bestBid = parseMarketPrice(depth.bids?.[0]?.[0]);
    const lastPrice = parseMarketPrice(lastTrade?.price);

    if (lastPrice === null && bestAsk === null && bestBid === null) {
      return NextResponse.json({ message: "Tabdeal hat keine verwertbaren Preisdaten geliefert." }, { status: 502 });
    }

    return NextResponse.json({
      source: "Tabdeal",
      symbol: TABDEAL_SYMBOL,
      lastPrice,
      bestAsk,
      bestBid,
      spread: bestAsk !== null && bestBid !== null ? bestAsk - bestBid : null,
      lastTradeTime: typeof lastTrade?.time === "number" ? new Date(lastTrade.time).toISOString() : null,
      fetchedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ message: "Tabdeal ist aktuell nicht erreichbar." }, { status: 502 });
  }
}
