"use client";

import { useActiveProject } from "@/lib/context";

export default function ProjectDetail() {
  const project = useActiveProject();

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">No project selected.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-[22px] font-semibold text-foreground">
        {project.icon} {project.name}
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        {project.sections.length} sections · {project.events.length} events
      </p>
      <p className="text-muted-foreground text-sm mt-4">Project detail — coming soon (Phase 3)</p>
    </div>
  );
}
