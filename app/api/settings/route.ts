import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  let settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default", workingDays: "1,2,3,4,5" },
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { workingDays } = body;

  if (!workingDays || typeof workingDays !== "string") {
    return NextResponse.json(
      { error: "workingDays (comma-separated string) is required" },
      { status: 400 },
    );
  }

  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: { workingDays },
    create: { id: "default", workingDays },
  });

  return NextResponse.json(settings);
}
