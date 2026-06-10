import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess } from "@/lib/auth";
import { updateMonthlyPayment } from "@/lib/serverDb";

export async function PATCH(request: NextRequest) {
  const auth = requireWriteAccess(request);

  if (auth.error) {
    return auth.error;
  }

  const body = (await request.json()) as {
    id?: string;
    paidAmount?: number;
  };

  if (!body.id || typeof body.paidAmount !== "number") {
    return NextResponse.json({ message: "Ungultige Zahlungsdaten." }, { status: 400 });
  }

  const payment = await updateMonthlyPayment(auth.payload.ownerId, body.id, body.paidAmount);

  if (!payment) {
    return NextResponse.json({ message: "Zahlung nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ payment });
}
