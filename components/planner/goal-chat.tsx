"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";

interface GoalChatProps {
  onGoalsComplete: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const GoalChat = ({ onGoalsComplete }: GoalChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(
    `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  const year = new Date().getFullYear();

  useEffect(() => {
    // Send initial message to kick off conversation
    sendMessage("Hi, I'd like to set my goals for this year.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (loading) return;

    const userMsg: Message = { role: "user", content: text };
    if (text !== "Hi, I'd like to set my goals for this year.") {
      setMessages((prev) => [...prev, userMsg]);
    }
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId.current,
          year,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);

      if (data.goalsComplete && data.goals) {
        // Save goals to DB
        for (const goal of data.goals) {
          await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...goal, year }),
          });
        }

        // Generate the full plan cascade
        setGeneratingPlan(true);
        await fetch("/api/plan/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "full" }),
        });

        setGeneratingPlan(false);
        onGoalsComplete();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  if (generatingPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <Spinner color="primary" size="lg" />
        <div className="text-center">
          <p className="text-sm font-bold">Generating your plan...</p>
          <p className="text-xs text-default-400 mt-1">
            Creating yearly overview, monthly tasks, weekly plan, and today&apos;s
            priorities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <h2 className="text-lg font-bold tracking-tight">
          Set Your {year} Goals
        </h2>
        <p className="text-xs text-default-400">
          Chat with AI to define what you want to achieve this year
        </p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-default-100 rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-default-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <Spinner color="primary" size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        className="px-4 sm:px-6 py-3 border-t border-default-200/30"
        onSubmit={handleSubmit}
      >
        <div className="flex gap-2">
          <Input
            classNames={{
              inputWrapper: "rounded-xl bg-default-100/50",
            }}
            isDisabled={loading}
            placeholder="Type your response..."
            size="sm"
            value={input}
            onValueChange={setInput}
          />
          <Button
            className="rounded-xl font-semibold shrink-0"
            color="primary"
            isDisabled={!input.trim() || loading}
            size="sm"
            type="submit"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};
