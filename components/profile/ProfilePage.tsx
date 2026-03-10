"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Pencil,
  Check,
  X,
  RefreshCw,
  Briefcase,
  Target,
  Layers,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase";
import { FIELD_OPTIONS } from "@/config/skillSuggestions";

export function ProfilePage() {
  const { user, profile, setProfile, setShowProfilePage, setShowProfileModal } =
    useAppStore();

  const displayName =
    (profile?.metadata?.display_name as string) ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = (profile?.metadata?.avatar_url as string) || "";

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editName, setEditName] = useState(displayName);
  const [editAvatarUrl, setEditAvatarUrl] = useState(avatarUrl);
  const [editField, setEditField] = useState(profile?.field || "");
  const [editSkills, setEditSkills] = useState<string[]>(
    profile?.current_skills || []
  );
  const [editExperience, setEditExperience] = useState(
    profile?.experience_level || ""
  );
  const [editGoal, setEditGoal] = useState(profile?.career_goal || "");
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveMetadata = async (updates: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();
    if (data) setProfile(data);
    setSaving(false);
    setEditingSection(null);
  };

  const handleSaveName = () => {
    saveMetadata({
      metadata: { ...profile?.metadata, display_name: editName },
    });
  };

  const handleSaveAvatar = async (file: File) => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();

    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;

    await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    await saveMetadata({
      metadata: { ...profile?.metadata, avatar_url: publicUrl },
    });
    setEditAvatarUrl(publicUrl);
  };

  const handleSaveField = () => saveMetadata({ field: editField });
  const handleSaveSkills = () =>
    saveMetadata({ current_skills: editSkills });
  const handleSaveExperience = () =>
    saveMetadata({ experience_level: editExperience });
  const handleSaveGoal = () =>
    saveMetadata({ career_goal: editGoal || null });

  const addSkillTag = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !editSkills.includes(trimmed)) {
      setEditSkills([...editSkills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRetakeQuestionnaire = () => {
    setShowProfilePage(false);
    setShowProfileModal(true);
  };

  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const currentAvatarUrl = editAvatarUrl || avatarUrl;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => setShowProfilePage(false)}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>

        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-10">
          <div className="relative group">
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-border flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-light">
                  {initials}
                </span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleSaveAvatar(file);
              }}
            />
          </div>

          <div className="flex-1 pt-2">
            {editingSection === "name" ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-lg font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingSection(null);
                  }}
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 rounded-lg hover:bg-surface-light text-success"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditName(displayName);
                    setEditingSection(null);
                  }}
                  className="p-2 rounded-lg hover:bg-surface-light text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <h1 className="font-display text-2xl font-bold">
                  {displayName}
                </h1>
                <button
                  onClick={() => {
                    setEditName(displayName);
                    setEditingSection("name");
                  }}
                  className="p-1.5 rounded-lg hover:bg-surface-light text-muted
                    opacity-0 group-hover/name:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-sm text-muted mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6">
          {/* Field */}
          <ProfileSection
            icon={<Briefcase className="w-4 h-4" />}
            title="Field"
            editing={editingSection === "field"}
            onEdit={() => {
              setEditField(profile?.field || "");
              setEditingSection("field");
            }}
            onCancel={() => setEditingSection(null)}
            onSave={handleSaveField}
            saving={saving}
          >
            {editingSection === "field" ? (
              <div className="grid grid-cols-2 gap-2">
                {FIELD_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setEditField(f)}
                    className={`p-3 rounded-lg border text-sm text-left transition-all ${
                      editField === f
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-border-light text-muted hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-foreground">
                {profile?.field || (
                  <span className="text-muted italic">Not set</span>
                )}
              </p>
            )}
          </ProfileSection>

          {/* Skills */}
          <ProfileSection
            icon={<Layers className="w-4 h-4" />}
            title="Known Skills"
            editing={editingSection === "skills"}
            onEdit={() => {
              setEditSkills(profile?.current_skills || []);
              setEditingSection("skills");
            }}
            onCancel={() => setEditingSection(null)}
            onSave={handleSaveSkills}
            saving={saving}
          >
            {editingSection === "skills" ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Type a skill and press Enter"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkillTag(skillInput);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => addSkillTag(skillInput)}
                    disabled={!skillInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                        bg-primary/20 text-primary-light text-sm"
                    >
                      {s}
                      <button
                        onClick={() =>
                          setEditSkills(editSkills.filter((sk) => sk !== s))
                        }
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(profile?.current_skills || []).length > 0 ? (
                  profile!.current_skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-surface-lighter text-sm text-foreground"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-muted italic text-sm">
                    No skills added
                  </span>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Experience Level */}
          <ProfileSection
            icon={<Award className="w-4 h-4" />}
            title="Experience Level"
            editing={editingSection === "experience"}
            onEdit={() => {
              setEditExperience(profile?.experience_level || "");
              setEditingSection("experience");
            }}
            onCancel={() => setEditingSection(null)}
            onSave={handleSaveExperience}
            saving={saving}
          >
            {editingSection === "experience" ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "beginner", label: "Beginner", desc: "Just starting out" },
                  { value: "intermediate", label: "Intermediate", desc: "Some experience" },
                  { value: "advanced", label: "Advanced", desc: "Strong foundation" },
                  { value: "expert", label: "Expert", desc: "Deep expertise" },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setEditExperience(level.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      editExperience === level.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-border-light"
                    }`}
                  >
                    <p className="text-sm font-medium">{level.label}</p>
                    <p className="text-xs text-muted mt-0.5">{level.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-foreground capitalize">
                {profile?.experience_level || (
                  <span className="text-muted italic normal-case">Not set</span>
                )}
              </p>
            )}
          </ProfileSection>

          {/* Career Goal */}
          <ProfileSection
            icon={<Target className="w-4 h-4" />}
            title="Career Goal"
            editing={editingSection === "goal"}
            onEdit={() => {
              setEditGoal(profile?.career_goal || "");
              setEditingSection("goal");
            }}
            onCancel={() => setEditingSection(null)}
            onSave={handleSaveGoal}
            saving={saving}
          >
            {editingSection === "goal" ? (
              <Input
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder='e.g., "Build ML systems at work"'
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveGoal();
                  if (e.key === "Escape") setEditingSection(null);
                }}
              />
            ) : (
              <p className="text-foreground">
                {profile?.career_goal || (
                  <span className="text-muted italic">Not set</span>
                )}
              </p>
            )}
          </ProfileSection>
        </div>

        {/* Retake Questionnaire */}
        <div className="mt-10 pt-6 border-t border-border">
          <button
            onClick={handleRetakeQuestionnaire}
            className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-border
              hover:border-border-light hover:bg-surface-light transition-colors text-sm text-muted hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Setup Questionnaire
          </button>
          <p className="text-xs text-muted mt-2">
            This will re-run the onboarding flow. Your existing skill roadmaps
            won&apos;t be affected.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileSection({
  icon,
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-muted">
          {icon}
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-surface-light text-muted text-xs"
            >
              Cancel
            </button>
            <Button size="sm" onClick={onSave} loading={saving}>
              <Check className="w-3 h-3" />
              Save
            </Button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
              hover:bg-surface-light text-muted text-xs transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
