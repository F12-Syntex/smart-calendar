import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, summary } = body;

  if (!id || typeof summary !== "string") {
    return NextResponse.json(
      { error: "id and summary are required" },
      { status: 400 },
    );
  }

  const plan = await prisma.monthlyPlan.update({
    where: { id },
    data: { summary },
  });

  return NextResponse.json(plan);
}
