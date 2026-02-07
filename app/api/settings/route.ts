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

  const data: Record<string, unknown> = {};
  if (typeof body.workingDays === "string") data.workingDays = body.workingDays;
  if (body.dailySchedule !== undefined) data.dailySchedule = body.dailySchedule;
  if (body.dynamicSources !== undefined) data.dynamicSources = body.dynamicSources;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", workingDays: "1,2,3,4,5", ...data },
  });

  return NextResponse.json(settings);
}
