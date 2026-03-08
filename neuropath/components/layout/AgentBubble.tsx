"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Minus, User, Wand2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { DBChatMessage } from "@/types";

export function AgentBubble() {
  const {
    activeSkillId,
    skills,
    agentMessages,
    addAgentMessage,
    nodes,
    selectedNodeId,
    user,
    isAgentExpanded,
    setIsAgentExpanded,
    setNodes,
    setInvalidateResourcesNodeId,
  } = useAppStore();

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages]);

  const activeSkill = skills.find((s) => s.id === activeSkillId);
  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  const handleSend = async () => {
    if (!input.trim() || !user || isStreaming) return;

    const userMessage: DBChatMessage = {
      id: crypto.randomUUID(),
      skill_id: activeSkillId || "",
      user_id: user.id,
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    addAgentMessage(userMessage);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: activeSkillId,
          message: userMessage.content,
          skillName: activeSkill?.name,
          activeNodeId: selectedNodeId,
          activeNodeLabel: activeNode?.label,
          nodes: nodes.map((n) => ({
            id: n.id,
            label: n.label,
            node_key: n.node_key,
            module_order: n.module_order,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        addAgentMessage({
          id: crypto.randomUUID(),
          skill_id: activeSkillId || "",
          user_id: user.id,
          role: "assistant",
          content: data.error || "Something went wrong. Please try again.",
          created_at: new Date().toISOString(),
        });
        return;
      }

      if (data.nodes) {
        setNodes(data.nodes);
      }
      if (data.invalidateNodeId) {
        setInvalidateResourcesNodeId(data.invalidateNodeId);
      }

      addAgentMessage({
        id: crypto.randomUUID(),
        skill_id: activeSkillId || "",
        user_id: user.id,
        role: "assistant",
        content: data.message || "Done.",
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Agent error:", error);
      addAgentMessage({
        id: crypto.randomUUID(),
        skill_id: activeSkillId || "",
        user_id: user.id,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const bubble = (
    <button
      onClick={() => setIsAgentExpanded(!isAgentExpanded)}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full glass-panel-strong shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex items-center justify-center hover:scale-105 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-200 border border-black/5"
      aria-label={isAgentExpanded ? "Close agent" : "Open agent"}
    >
      <Wand2 className="w-7 h-7 text-primary" />
    </button>
  );

  const panel = isAgentExpanded && (
    <motion.div
      key="agent-panel"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 right-6 z-50 w-[380px] max-h-[420px] flex flex-col rounded-2xl glass-panel-strong shadow-[0_12px_48px_rgba(0,0,0,0.1)] overflow-hidden border border-black/5"
    >
      <div className="p-3 border-b border-black/6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-primary-light" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold">Agent</h2>
            {activeSkill && (
              <span className="text-[11px] text-muted truncate block max-w-[180px]">
                {activeSkill.name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsAgentExpanded(false)}
          className="p-1.5 rounded-lg hover:bg-surface-light transition-colors"
        >
          <Minus className="w-4 h-4 text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {agentMessages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
            <Wand2 className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">What can I wrangle up for ya?</p>
            <p className="text-xs mt-2 max-w-[260px]">
              Ask me to add a source to a module, modify the roadmap, or guide you.
              <br />
              <span className="text-muted/80">e.g. &quot;Add https://... to OOP&quot;</span>
            </p>
          </div>
        ) : (
          <>
            {agentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wand2 className="w-3 h-3 text-primary-light" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-black/5 text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-primary-light" />
                  </div>
                )}
              </div>
            ))}
            {isStreaming && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-3 h-3 text-primary-light" />
                </div>
                <div className="flex gap-1 items-center px-3 py-2">
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

      <div className="p-3 border-t border-black/6">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Add a source, modify roadmap..."
            disabled={isStreaming}
            className="flex-1 bg-black/4 border border-black/8 rounded-full px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/40 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-lg bg-primary hover:bg-primary-light text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {bubble}
      <AnimatePresence>{panel}</AnimatePresence>
    </>
  );
}
