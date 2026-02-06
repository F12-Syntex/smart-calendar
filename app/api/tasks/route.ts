import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const week = searchParams.get("week");
  const day = searchParams.get("day");

  const where: Record<string, unknown> = {};

  if (scope) where.scope = scope;
  if (year) where.scopeYear = parseInt(year);
  if (month) where.scopeMonth = parseInt(month);
  if (week) where.scopeWeek = parseInt(week);
  if (day) where.scopeDay = parseInt(day);

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, completed } = body;

  if (!id || typeof completed !== "boolean") {
    return NextResponse.json(
      { error: "id and completed (boolean) are required" },
      { status: 400 },
    );
  }

  const task = await prisma.task.update({
    where: { id },
    data: { completed },
  });

  return NextResponse.json(task);
}
