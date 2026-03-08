export function mergeSkills(existing: string[], newSkills: string[]): string[] {
  const set = new Set(existing.map((s) => s.toLowerCase()));
  const merged = [...existing];
  for (const skill of newSkills) {
    if (!set.has(skill.toLowerCase())) {
      merged.push(skill);
      set.add(skill.toLowerCase());
    }
  }
  return merged.slice(0, 20);
}

export function parseSkillsFromText(text: string): string[] {
  return text
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 50);
}

export function isProfileComplete(profile: {
  field?: string | null;
  current_skills?: string[] | null;
  experience_level?: string | null;
}): boolean {
  return !!(
    profile.field &&
    profile.current_skills &&
    profile.current_skills.length > 0 &&
    profile.experience_level
  );
}
