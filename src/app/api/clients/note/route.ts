import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/clients/note — add a note
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, text } = body;

  if (!clientId || !text) {
    return NextResponse.json({ error: "clientId and text required" }, { status: 400 });
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      clientId,
      notes: text,
      source: "MANUAL",
    },
  });

  return NextResponse.json({ checkIn });
}
