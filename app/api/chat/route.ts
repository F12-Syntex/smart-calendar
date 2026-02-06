import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  chatForGoals,
  getGoalSystemPrompt,
  parseGoalCompletion,
} from "@/lib/ai-planner";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, sessionId, year } = body;

  if (!message || !sessionId || !year) {
    return NextResponse.json(
      { error: "message, sessionId, and year are required" },
      { status: 400 },
    );
  }

  // Save user message
  await prisma.chatMessage.create({
    data: { role: "user", content: message, sessionId },
  });

  // Build conversation history
  const history = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  const systemPrompt = getGoalSystemPrompt(year);
  const messages = [
    systemPrompt,
    ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  // Get AI response
  const aiResponse = await chatForGoals(messages);

  // Save AI response
  await prisma.chatMessage.create({
    data: { role: "assistant", content: aiResponse, sessionId },
  });

  // Check if goals are finalized
  const goalCompletion = parseGoalCompletion(aiResponse);

  return NextResponse.json({
    response: aiResponse,
    goalsComplete: goalCompletion !== null,
    goals: goalCompletion?.goals || null,
  });
}
