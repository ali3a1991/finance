import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";

const TABDEAL_SYMBOL = "USDTIRT";
const TABDEAL_BASE_URL = "https://api1.tabdeal.org/r/api/v1";
const KUCOIN_SYMBOL = "USDT-EUR";
const KUCOIN_TICKER_URL = "https://api.kucoin.com/api/v1/market/orderbook/level1";

type DepthResponse = {
  asks?: string[][];
  bids?: string[][];
};

type TradeResponse = {
  price?: string;
  time?: number;
};

type KuCoinTickerResponse = {
  code?: string;
  data?: {
    time?: number;
    price?: string;
    bestBid?: string;
    bestAsk?: string;
  } | null;
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
    const kucoinResponse = await fetch(`${KUCOIN_TICKER_URL}?symbol=${KUCOIN_SYMBOL}`, { cache: "no-store" });

    if (!depthResponse.ok || !tradesResponse.ok || !kucoinResponse.ok) {
      return NextResponse.json({ message: "Die Preisdaten konnten nicht geladen werden." }, { status: 502 });
    }

    const depth = (await depthResponse.json()) as DepthResponse;
    const trades = (await tradesResponse.json()) as TradeResponse[];
    const kucoinTicker = (await kucoinResponse.json()) as KuCoinTickerResponse;
    const lastTrade = trades[0];
    const bestAsk = parseMarketPrice(depth.asks?.[0]?.[0]);
    const bestBid = parseMarketPrice(depth.bids?.[0]?.[0]);
    const lastPrice = parseMarketPrice(lastTrade?.price);
    const kucoinPrice = parseMarketPrice(kucoinTicker.data?.price);
    const kucoinBestAsk = parseMarketPrice(kucoinTicker.data?.bestAsk);
    const kucoinBestBid = parseMarketPrice(kucoinTicker.data?.bestBid);

    if ((lastPrice === null && bestAsk === null && bestBid === null) || kucoinPrice === null) {
      return NextResponse.json({ message: "Die Preisquellen haben keine verwertbaren Daten geliefert." }, { status: 502 });
    }

    return NextResponse.json({
      source: "Tabdeal",
      symbol: TABDEAL_SYMBOL,
      lastPrice,
      bestAsk,
      bestBid,
      spread: bestAsk !== null && bestBid !== null ? bestAsk - bestBid : null,
      lastTradeTime: typeof lastTrade?.time === "number" ? new Date(lastTrade.time).toISOString() : null,
      kucoin: {
        source: "KuCoin",
        symbol: KUCOIN_SYMBOL,
        eurPerUsdt: kucoinPrice,
        bestAsk: kucoinBestAsk,
        bestBid: kucoinBestBid,
        fetchedAt: typeof kucoinTicker.data?.time === "number" ? new Date(kucoinTicker.data.time).toISOString() : null
      },
      fetchedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ message: "Die Preisdaten sind aktuell nicht erreichbar." }, { status: 502 });
  }
}
