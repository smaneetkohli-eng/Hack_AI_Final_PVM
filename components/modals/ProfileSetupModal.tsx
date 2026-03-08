"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase";
import { FIELD_OPTIONS, SKILL_SUGGESTIONS } from "@/config/skillSuggestions";
import type { DBNode, DBSkill } from "@/types";

export function ProfileSetupModal() {
  const {
    showProfileModal,
    setShowProfileModal,
    user,
    setProfile,
    addSkill: addSkillToStore,
    setActiveSkillId,
    setNodes,
  } = useAppStore();
  const [step, setStep] = useState(0);
  const [field, setField] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0, name: "" });

  if (!showProfileModal) return null;

  const suggestions = SKILL_SUGGESTIONS[field] || [];

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 10) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const generateRoadmapForSkill = async (
    skillName: string,
    profileData: { field: string; experienceLevel: string; careerGoal: string }
  ): Promise<{ skill: DBSkill; nodes: DBNode[] } | null> => {
    try {
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillName,
          scope: profileData.careerGoal
            ? `Learning path aligned with goal: ${profileData.careerGoal}`
            : `General learning path for ${skillName}`,
          experienceLevel: profileData.experienceLevel,
          priorKnowledge: "",
          timePerWeek: "3-7",
          learningStyle: ["mixed"],
          language: "English",
          userProfile: {
            field: profileData.field,
            currentSkills: [],
            experienceLevel: profileData.experienceLevel,
          },
        }),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    const supabase = createClient();
    const profileData = {
      user_id: user.id,
      field,
      current_skills: skills,
      experience_level: experienceLevel,
      career_goal: careerGoal || null,
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profileData, { onConflict: "user_id" })
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    setLoading(false);
    setGenerating(true);
    setGenProgress({ current: 0, total: skills.length, name: skills[0] || "" });

    let lastResult: { skill: DBSkill; nodes: DBNode[] } | null = null;

    for (let i = 0; i < skills.length; i++) {
      setGenProgress({ current: i + 1, total: skills.length, name: skills[i] });
      const result = await generateRoadmapForSkill(skills[i], {
        field,
        experienceLevel,
        careerGoal,
      });
      if (result) {
        addSkillToStore(result.skill);
        lastResult = result;
      }
    }

    if (lastResult) {
      setActiveSkillId(lastResult.skill.id);
      setNodes(lastResult.nodes);
    }

    setGenerating(false);
    setShowProfileModal(false);
  };

  const canProceed = [
    field !== "",
    skills.length > 0,
    experienceLevel !== "",
    true,
  ];

  const steps = [
    {
      title: "What's your primary field?",
      subtitle: "This helps us tailor your learning experience",
    },
    {
      title: "What do you want to learn?",
      subtitle: "Add 1-5 skills — we'll generate a roadmap for each",
    },
    {
      title: "What's your experience level?",
      subtitle: "Overall, across your field",
    },
    {
      title: "What's your career goal?",
      subtitle: "Optional — helps personalize your roadmaps",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface border border-border rounded-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {generating ? "Generating your roadmaps" : steps[step].title}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {generating
                ? `Creating roadmap ${genProgress.current} of ${genProgress.total}...`
                : steps[step].subtitle}
            </p>
          </div>
          {!loading && !generating && (
            <button
              onClick={() => setShowProfileModal(false)}
              className="p-1.5 rounded-lg hover:bg-surface-light text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!generating && (
          <div className="flex gap-1 px-5 pt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-surface-lighter"
                }`}
              />
            ))}
          </div>
        )}

        <div className="p-5 min-h-[240px]">
          {generating ? (
            <div className="flex flex-col items-center justify-center h-[200px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-primary/30" />
                <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
              </div>
              <p className="text-sm font-medium mt-4">{genProgress.name}</p>
              <p className="text-xs text-muted mt-1 animate-pulse">
                Building your personalized learning path...
              </p>
              <div className="w-48 h-1.5 bg-surface-lighter rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setField(f)}
                      className={`p-3 rounded-lg border text-sm text-left transition-all ${
                        field === f
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-border-light text-muted hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => addSkill(skillInput)}
                      disabled={!skillInput.trim()}
                    >
                      Add
                    </Button>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                            bg-primary/20 text-primary-light text-sm"
                        >
                          {s}
                          <button
                            onClick={() => removeSkill(s)}
                            className="hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted mb-2">
                        Suggestions for {field}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions
                          .filter((s) => !skills.includes(s))
                          .slice(0, 8)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => addSkill(s)}
                              className="px-2.5 py-1 rounded-full border border-border
                                text-xs text-muted hover:text-foreground hover:border-border-light
                                transition-colors"
                            >
                              + {s}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "beginner",
                      label: "Beginner",
                      desc: "Just starting out",
                    },
                    {
                      value: "intermediate",
                      label: "Intermediate",
                      desc: "Some experience",
                    },
                    {
                      value: "advanced",
                      label: "Advanced",
                      desc: "Strong foundation",
                    },
                    {
                      value: "expert",
                      label: "Expert",
                      desc: "Deep expertise",
                    },
                  ].map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setExperienceLevel(level.value)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        experienceLevel === level.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border-light"
                      }`}
                    >
                      <p className="text-sm font-medium">{level.label}</p>
                      <p className="text-xs text-muted mt-0.5">{level.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <Input
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder='e.g., "Build ML systems at work" or "Transition to frontend"'
                    label="Career Goal"
                  />
                  <p className="text-xs text-muted">
                    This is optional. You can always update it later in settings.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          )}
        </div>

        {!generating && (
        <div className="flex items-center justify-between p-5 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => (step > 0 ? setStep(step - 1) : setShowProfileModal(false))}
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 0 ? "Back" : "Later"}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed[step]}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              <Sparkles className="w-4 h-4" />
              Complete Setup
            </Button>
          )}
        </div>
        )}
      </motion.div>
    </div>
  );
}
