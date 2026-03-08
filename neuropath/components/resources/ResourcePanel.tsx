"use client";

import { useState, useEffect, useCallback } from "react";
import { Video, FileText, RefreshCw, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResourceCard } from "./ResourceCard";
import { createClient } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import type { DBNodeResource } from "@/types";

interface ResourcePanelProps {
  nodeId: string;
  nodeLabel: string;
  skillName: string;
}

export function ResourcePanel({ nodeId, nodeLabel, skillName }: ResourcePanelProps) {
  const { user } = useAppStore();
  const [resources, setResources] = useState<DBNodeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [suggestUrl, setSuggestUrl] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/resources/${nodeId}`);
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const response = await fetch("/api/resources/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, nodeLabel, skillName }),
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error("Error regenerating:", error);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSuggest = async () => {
    if (!suggestUrl.trim()) return;
    try {
      const response = await fetch("/api/resources/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, url: suggestUrl, nodeLabel }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.resource) {
          setResources((prev) => [...prev, data.resource]);
        }
      }
    } catch (error) {
      console.error("Error suggesting:", error);
    }
    setSuggestUrl("");
    setShowSuggest(false);
  };

  const handleResourceClick = async (resource: DBNodeResource) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("learning_events").insert({
      user_id: user.id,
      node_id: nodeId,
      event_type: "resource_clicked",
      metadata: { resource_id: resource.id, type: resource.type },
    });
  };

  const videos = resources.filter((r) => r.type === "video");
  const articles = resources.filter((r) => r.type !== "video");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Resources</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          loading={regenerating}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading resources...
        </div>
      ) : (
        <>
          {videos.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Video className="w-3.5 h-3.5 text-secondary" />
                <span className="text-xs font-medium text-muted">Videos</span>
              </div>
              <div className="space-y-2">
                {videos.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onResourceClick={handleResourceClick}
                  />
                ))}
              </div>
            </div>
          )}

          {articles.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="w-3.5 h-3.5 text-primary-light" />
                <span className="text-xs font-medium text-muted">
                  Articles & Docs
                </span>
              </div>
              <div className="space-y-2">
                {articles.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onResourceClick={handleResourceClick}
                  />
                ))}
              </div>
            </div>
          )}

          {resources.length === 0 && !loading && (
            <p className="text-sm text-muted text-center py-4">
              No resources found. Try regenerating.
            </p>
          )}
        </>
      )}

      <div className="pt-2 border-t border-border">
        {showSuggest ? (
          <div className="flex gap-2">
            <input
              value={suggestUrl}
              onChange={(e) => setSuggestUrl(e.target.value)}
              placeholder="Paste a URL..."
              className="flex-1 bg-surface-light border border-border rounded-lg px-3 py-2 text-sm
                text-foreground placeholder:text-muted/50
                focus:outline-none focus:border-primary transition-colors"
            />
            <Button size="sm" onClick={handleSuggest}>
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowSuggest(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Suggest a Source
          </Button>
        )}
      </div>
    </div>
  );
}
