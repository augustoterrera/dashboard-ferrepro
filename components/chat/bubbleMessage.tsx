"use client";

import React from "react";
import { Bot, User, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import type { ChatMsg } from "@/types/chat";

export type MarkdownComponents = Record<string, any>;

export const MessageBubble = React.memo(function MessageBubble({
  message,
  markdownComponents,
  onViewDashboard,
}: {
  message: ChatMsg;
  markdownComponents: MarkdownComponents;
  onViewDashboard?: (toolData: any) => void;
}) {
  // Buscar si hay tool-result en este mensaje
  const toolResultPart = message.parts.find(p => p.type === "tool-result");
  const hasToolData = toolResultPart && toolResultPart.type === "tool-result";

  return (
    <div
      className={`flex gap-3 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {message.role === "assistant" && (
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div
        className={`flex flex-col gap-2 max-w-[80%] ${
          message.role === "user" ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-lg px-4 py-2 ${
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return (
                <div
                  key={`${message.id}-text-${index}`}
                  className="prose prose-sm max-w-none dark:prose-invert"
                >
                  <ReactMarkdown components={markdownComponents}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Botón "Ver en Dashboard" si hay tool data */}
        {hasToolData && onViewDashboard && message.role === "assistant" && (
          <Button
            variant="default"
            size="sm"
            className="gap-2 w-full h-10  hover:opacity-90 cursor-pointer bg-blue-500"
            onClick={() => onViewDashboard(toolResultPart)}
          >
            <BarChart3 className="h-4 w-4" />
            Ver en Dashboard
          </Button>
        )}
      </div>

      {message.role === "user" && (
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
});