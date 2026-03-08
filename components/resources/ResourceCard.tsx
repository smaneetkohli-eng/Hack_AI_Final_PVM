"use client";

import Image from "next/image";
import { ExternalLink, Play, FileText, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { DBNodeResource } from "@/types";

interface ResourceCardProps {
  resource: DBNodeResource;
  onResourceClick?: (resource: DBNodeResource) => void;
}

export function ResourceCard({ resource, onResourceClick }: ResourceCardProps) {
  const isVideo = resource.type === "video";

  return (
    <a
      href={resource.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onResourceClick?.(resource)}
      className="flex gap-3 p-3 rounded-lg bg-surface-light border border-border
        hover:border-border-light hover:bg-surface-lighter
        transition-all duration-200 group"
    >
      {resource.thumbnail_url ? (
        <div className="w-20 h-14 rounded-md overflow-hidden flex-shrink-0 bg-surface-lighter relative">
          <Image
            src={resource.thumbnail_url}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-md bg-surface-lighter flex items-center justify-center flex-shrink-0">
          {isVideo ? (
            <Play className="w-4 h-4 text-secondary" />
          ) : (
            <FileText className="w-4 h-4 text-primary-light" />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary-light transition-colors">
          {resource.title}
        </p>
        {resource.description && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2">
            {resource.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted truncate">
            {resource.source_name}
          </span>
          {resource.duration && (
            <span className="text-xs text-muted">· {resource.duration}</span>
          )}
          {resource.is_verified && (
            <Badge variant="success" className="!py-0 !text-[10px]">
              <BadgeCheck className="w-2.5 h-2.5" />
              Verified
            </Badge>
          )}
        </div>
      </div>

      <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
    </a>
  );
}
