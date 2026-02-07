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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, scope, scopeYear, scopeMonth, scopeWeek, scopeDay } = body;

  if (!title || !scope || !scopeYear) {
    return NextResponse.json(
      { error: "title, scope, and scopeYear are required" },
      { status: 400 },
    );
  }

  // Get max sort order for this scope
  const existing = await prisma.task.findMany({
    where: { scope, scopeYear, scopeMonth, scopeWeek, scopeDay },
    orderBy: { sortOrder: "desc" },
    take: 1,
  });
  const nextOrder = existing.length > 0 ? existing[0].sortOrder + 1 : 0;

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      scope,
      scopeYear,
      scopeMonth: scopeMonth ?? null,
      scopeWeek: scopeWeek ?? null,
      scopeDay: scopeDay ?? null,
      sortOrder: nextOrder,
    },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof updates.completed === "boolean") data.completed = updates.completed;
  if (typeof updates.title === "string") data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (typeof updates.startHour === "number") data.startHour = updates.startHour;
  if (typeof updates.durationMinutes === "number") data.durationMinutes = updates.durationMinutes;

  const task = await prisma.task.update({
    where: { id },
    data,
  });

  return NextResponse.json(task);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
