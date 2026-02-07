import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      monthlyPlans: {
        orderBy: { month: "asc" },
      },
    },
  });

  return NextResponse.json(goals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, year, multiplier, frequency, category } = body;

  if (!title || !description || !year) {
    return NextResponse.json(
      { error: "title, description, and year are required" },
      { status: 400 },
    );
  }

  const goal = await prisma.goal.create({
    data: {
      title,
      description,
      year,
      multiplier: multiplier ?? 1.0,
      frequency: frequency || null,
      category: category || "growth",
    },
  });

  return NextResponse.json(goal, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (updates.title !== undefined) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.multiplier !== undefined) data.multiplier = updates.multiplier;
  if (updates.frequency !== undefined) data.frequency = updates.frequency || null;
  if (updates.category !== undefined) data.category = updates.category;

  const goal = await prisma.goal.update({
    where: { id },
    data,
    include: { monthlyPlans: { orderBy: { month: "asc" } } },
  });

  return NextResponse.json(goal);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.goal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
