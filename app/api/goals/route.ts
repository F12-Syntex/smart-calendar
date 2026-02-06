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
  const { title, description, year } = body;

  if (!title || !description || !year) {
    return NextResponse.json(
      { error: "title, description, and year are required" },
      { status: 400 },
    );
  }

  const goal = await prisma.goal.create({
    data: { title, description, year },
  });

  return NextResponse.json(goal, { status: 201 });
}
