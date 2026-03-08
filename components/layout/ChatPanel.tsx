"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { DBChatMessage } from "@/types";

export function ChatPanel() {
  const {
    activeSkillId,
    skills,
    chatMessages,
    addChatMessage,
    nodes,
    selectedNodeId,
    user,
    isChatOpen,
  } = useAppStore();

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingContent]);

  const activeSkill = skills.find((s) => s.id === activeSkillId);
  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  const handleSend = async () => {
    if (!input.trim() || !activeSkillId || !user || isStreaming) return;

    const userMessage: DBChatMessage = {
      id: crypto.randomUUID(),
      skill_id: activeSkillId,
      user_id: user.id,
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    addChatMessage(userMessage);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: activeSkillId,
          message: userMessage.content,
          skillName: activeSkill?.name,
          activeNodeLabel: activeNode?.label,
          nodeStatuses: nodes.map((n) => ({
            label: n.label,
            status: n.status,
          })),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        fullContent += text;
        setStreamingContent(fullContent);
      }

      const assistantMessage: DBChatMessage = {
        id: crypto.randomUUID(),
        skill_id: activeSkillId,
        user_id: user.id,
        role: "assistant",
        content: fullContent,
        created_at: new Date().toISOString(),
      };

      addChatMessage(assistantMessage);
      setStreamingContent("");
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isChatOpen) return null;

  return (
    <aside className="w-80 border-l border-border bg-surface flex flex-col fixed lg:relative right-0 inset-y-0 z-40">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-secondary" />
        <h2 className="font-display text-sm font-semibold">AI Adviser</h2>
        {activeSkill && (
          <span className="text-xs text-muted ml-auto truncate max-w-[120px]">
            {activeSkill.name}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeSkillId ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <Bot className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Select a skill to start chatting</p>
            <p className="text-xs mt-1">
              I can help with any concept in your roadmap
            </p>
          </div>
        ) : chatMessages.length === 0 && !streamingContent ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <Bot className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Ask me about any concept...</p>
            <p className="text-xs mt-1">
              I&apos;m scoped to your {activeSkill?.name} roadmap
            </p>
          </div>
        ) : (
          <>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-secondary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-surface-light text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] mt-1 opacity-50">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-primary-light" />
                  </div>
                )}
              </div>
            ))}
            {streamingContent && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-secondary" />
                </div>
                <div className="max-w-[85%] rounded-xl rounded-bl-sm bg-surface-light px-3.5 py-2.5 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap">{streamingContent}</p>
                </div>
              </div>
            )}
            {isStreaming && !streamingContent && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex gap-1 items-center px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={
              activeSkillId ? "Ask about any concept..." : "Select a skill first"
            }
            disabled={!activeSkillId || isStreaming}
            className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm
              text-foreground placeholder:text-muted/50
              focus:outline-none focus:border-primary transition-colors
              disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !activeSkillId || isStreaming}
            className="p-2.5 rounded-lg bg-primary hover:bg-primary-light text-white
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
