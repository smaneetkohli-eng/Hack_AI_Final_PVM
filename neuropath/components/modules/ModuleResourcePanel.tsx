"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Video,
  FileText,
  BookOpen,
  Code2,
  FolderGit2,
  RefreshCw,
  Plus,
  Loader2,
  ExternalLink,
  Clock,
  Play,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import type { DBNodeResource, ResourceType } from "@/types";

interface ModuleResourcePanelProps {
  nodeId: string;
  nodeLabel: string;
  skillName: string;
}

interface ResourceGroup {
  type: ResourceType;
  label: string;
  icon: React.ReactNode;
  items: DBNodeResource[];
}

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  lesson: { label: "Lessons", icon: <BookOpen className="w-3.5 h-3.5 text-primary-light" /> },
  exercise: { label: "Exercises", icon: <Code2 className="w-3.5 h-3.5 text-secondary" /> },
  project: { label: "Projects", icon: <FolderGit2 className="w-3.5 h-3.5 text-yellow-400" /> },
  article: { label: "Articles", icon: <FileText className="w-3.5 h-3.5 text-primary-light" /> },
  video: { label: "Videos", icon: <Video className="w-3.5 h-3.5 text-secondary" /> },
  doc: { label: "Documentation", icon: <FileText className="w-3.5 h-3.5 text-muted" /> },
};

function classifyResource(r: DBNodeResource): ResourceType {
  if (r.type && r.type !== "user_suggested") return r.type;
  const url = r.url?.toLowerCase() || "";
  const title = r.title?.toLowerCase() || "";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "video";
  if (title.includes("exercise") || title.includes("practice")) return "exercise";
  if (title.includes("project") || url.includes("github.com")) return "project";
  if (title.includes("tutorial") || title.includes("lesson") || title.includes("guide")) return "lesson";
  return "article";
}

export function ModuleResourcePanel({ nodeId, nodeLabel, skillName }: ModuleResourcePanelProps) {
  const { user, invalidateResourcesNodeId, setInvalidateResourcesNodeId } = useAppStore();
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

  useEffect(() => {
    if (invalidateResourcesNodeId === nodeId) {
      fetchResources();
      setInvalidateResourcesNodeId(null);
    }
  }, [invalidateResourcesNodeId, nodeId, fetchResources, setInvalidateResourcesNodeId]);

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

  const groups: ResourceGroup[] = (() => {
    const grouped: Record<string, DBNodeResource[]> = {};
    for (const r of resources) {
      const type = classifyResource(r);
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(r);
    }

    const order: ResourceType[] = ["lesson", "exercise", "project", "article", "video", "doc"];
    return order
      .filter((t) => grouped[t]?.length)
      .map((t) => ({
        type: t,
        label: typeConfig[t]?.label || t,
        icon: typeConfig[t]?.icon || <FileText className="w-3.5 h-3.5" />,
        items: grouped[t],
      }));
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Resources</h3>
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
      ) : groups.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted">No resources found.</p>
          <p className="text-xs text-muted mt-1">Try regenerating or suggest a source below.</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.type}>
            <div className="flex items-center gap-1.5 mb-3">
              {group.icon}
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                {group.label}
              </span>
              <span className="text-xs text-muted/60 ml-1">({group.items.length})</span>
            </div>
            <div className="space-y-2">
              {group.items.map((r) => (
                <ResourceRow
                  key={r.id}
                  resource={r}
                  onResourceClick={handleResourceClick}
                />
              ))}
            </div>
          </div>
        ))
      )}

      <div className="pt-3 border-t border-border">
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

function ResourceRow({
  resource,
  onResourceClick,
}: {
  resource: DBNodeResource;
  onResourceClick: (r: DBNodeResource) => void;
}) {
  const isVideo = resource.type === "video";

  return (
    <a
      href={resource.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onResourceClick(resource)}
      className="flex gap-3 p-3 rounded-xl bg-surface border border-border
        hover:border-border-light hover:bg-surface-light
        transition-all duration-200 group"
    >
      <div className="w-9 h-9 rounded-lg bg-surface-lighter flex items-center justify-center flex-shrink-0">
        {isVideo ? (
          <Play className="w-4 h-4 text-secondary" />
        ) : (
          <FileText className="w-4 h-4 text-primary-light" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary-light transition-colors">
          {resource.title}
        </p>
        {resource.description && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2">
            {resource.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-muted truncate">
            {resource.source_name}
          </span>
          {resource.duration && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-muted">
              <Clock className="w-2.5 h-2.5" />
              {resource.duration}
            </span>
          )}
          {resource.is_verified && (
            <Badge variant="success" className="!py-0 !text-[10px]">
              <BadgeCheck className="w-2.5 h-2.5" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
    </a>
  );
}
