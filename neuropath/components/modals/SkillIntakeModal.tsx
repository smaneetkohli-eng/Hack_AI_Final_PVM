"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAppStore } from "@/store/useAppStore";
import type { DBNode, DBSkill } from "@/types";

export function SkillIntakeModal() {
  const {
    showSkillIntakeModal,
    setShowSkillIntakeModal,
    user,
    profile,
    addSkill,
    setActiveSkillId,
    setNodes,
  } = useAppStore();

  const [step, setStep] = useState(0);
  const [skillName, setSkillName] = useState("");
  const [scope, setScope] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [priorKnowledge, setPriorKnowledge] = useState("");
  const [timePerWeek, setTimePerWeek] = useState("3-7");
  const [learningStyle, setLearningStyle] = useState<string[]>(["mixed"]);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [generatingText, setGeneratingText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!showSkillIntakeModal) return null;

  const toggleLearningStyle = (style: string) => {
    setLearningStyle((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage("");
    setGeneratingText("Generating your personalized roadmap...");

    try {
      const reqBody = {
          skillName,
          scope,
          experienceLevel,
          priorKnowledge,
          timePerWeek,
          learningStyle,
          language,
          userProfile: profile
            ? {
                field: profile.field,
                currentSkills: profile.current_skills,
                experienceLevel: profile.experience_level,
              }
            : null,
      };
      const response = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errBody.error || "Failed to generate roadmap");
      }

      const data = await response.json();
      const skill: DBSkill = data.skill;
      const nodes: DBNode[] = data.nodes;

      addSkill(skill);
      setActiveSkillId(skill.id);
      setNodes(nodes);

      setShowSkillIntakeModal(false);
      resetForm();
    } catch (error) {
      console.error("Roadmap generation error:", error);
      setErrorMessage((error as Error)?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setSkillName("");
    setScope("");
    setExperienceLevel("beginner");
    setPriorKnowledge("");
    setTimePerWeek("3-7");
    setLearningStyle(["mixed"]);
    setLanguage("English");
    setGeneratingText("");
    setErrorMessage("");
  };

  const canProceed = [
    skillName.trim() !== "",
    true,
    true,
  ];

  const steps = [
    {
      title: "What do you want to learn?",
      subtitle: "Define your skill and learning scope",
    },
    {
      title: "Your background",
      subtitle: "Help us tailor the roadmap to your level",
    },
    {
      title: "Learning preferences",
      subtitle: "How and when do you prefer to learn?",
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
              {loading ? "Creating Roadmap" : steps[step].title}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {loading ? generatingText : steps[step].subtitle}
            </p>
          </div>
          {!loading && (
            <button
              onClick={() => {
                setShowSkillIntakeModal(false);
                resetForm();
              }}
              className="p-1.5 rounded-lg hover:bg-surface-light text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!loading && (
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

        <div className="p-5 min-h-[260px]">
          {errorMessage ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-sm text-red-400 mb-4 px-4">{errorMessage}</p>
              <Button variant="secondary" onClick={() => { setErrorMessage(""); handleGenerate(); }}>
                <Sparkles className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-[200px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-primary/30" />
                <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
              </div>
              <p className="text-sm text-muted mt-4 animate-pulse">
                {generatingText}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {step === 0 && (
                  <>
                    <Input
                      label="Skill name"
                      value={skillName}
                      onChange={(e) => setSkillName(e.target.value)}
                      placeholder='e.g., "Machine Learning", "React", "System Design"'
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-muted">
                        Goal / Scope
                      </label>
                      <textarea
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        placeholder='e.g., "I want to build recommendation systems at work, not become a researcher"'
                        className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-border
                          text-foreground placeholder:text-muted/50 resize-none h-24
                          focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
                          transition-colors"
                      />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <Select
                      label="Experience with this topic"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      options={[
                        { value: "beginner", label: "Beginner — brand new" },
                        {
                          value: "some_exposure",
                          label: "Some Exposure — heard of it, tried basics",
                        },
                        {
                          value: "intermediate",
                          label: "Intermediate — built things with it",
                        },
                        {
                          value: "advanced",
                          label: "Advanced — deep experience",
                        },
                      ]}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-muted">
                        Related things you already know
                      </label>
                      <textarea
                        value={priorKnowledge}
                        onChange={(e) => setPriorKnowledge(e.target.value)}
                        placeholder='e.g., "I know Python, basic statistics, linear algebra"'
                        className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-border
                          text-foreground placeholder:text-muted/50 resize-none h-24
                          focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
                          transition-colors"
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <Select
                      label="Time per week"
                      value={timePerWeek}
                      onChange={(e) => setTimePerWeek(e.target.value)}
                      options={[
                        { value: "1-3", label: "1-3 hours" },
                        { value: "3-7", label: "3-7 hours" },
                        { value: "7+", label: "7+ hours" },
                      ]}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-muted">
                        Learning style (select all that apply)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "videos", label: "Videos" },
                          { value: "reading", label: "Reading" },
                          { value: "projects", label: "Projects" },
                          { value: "mixed", label: "Mixed" },
                        ].map((s) => (
                          <button
                            key={s.value}
                            onClick={() => toggleLearningStyle(s.value)}
                            className={`p-2.5 rounded-lg border text-sm transition-all ${
                              learningStyle.includes(s.value)
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border text-muted hover:border-border-light"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Select
                      label="Preferred language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      options={[
                        { value: "English", label: "English" },
                        { value: "Spanish", label: "Spanish" },
                        { value: "French", label: "French" },
                        { value: "German", label: "German" },
                        { value: "Chinese", label: "Chinese" },
                        { value: "Japanese", label: "Japanese" },
                      ]}
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {!loading && !errorMessage && (
          <div className="flex items-center justify-between p-5 border-t border-border">
            <Button
              variant="ghost"
              onClick={() =>
                step > 0
                  ? setStep(step - 1)
                  : (() => {
                      setShowSkillIntakeModal(false);
                      resetForm();
                    })()
              }
            >
              <ChevronLeft className="w-4 h-4" />
              {step > 0 ? "Back" : "Cancel"}
            </Button>
            {step < 2 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed[step]}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleGenerate}>
                <Sparkles className="w-4 h-4" />
                Generate Roadmap
              </Button>
            )}
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center justify-between p-5 border-t border-border">
            <Button variant="ghost" onClick={() => setErrorMessage("")}>
              <ChevronLeft className="w-4 h-4" />
              Back to form
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
