"use client";

import { useState } from "react";
import { Brain, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-9 h-9 text-primary-light" />
          </div>
          <h1 className="font-display text-3xl font-bold">
            <span className="text-foreground">Neuro</span>
            <span className="text-primary-light">Path</span>
          </h1>
          <p className="text-muted mt-2 text-sm">
            Start your personalized learning journey.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <Sparkles className="w-10 h-10 text-secondary mx-auto mb-3" />
              <h2 className="font-display text-lg font-semibold mb-2">
                Check your email
              </h2>
              <p className="text-sm text-muted">
                We sent a magic link to <strong>{email}</strong>.
                <br />
                Click it to get started.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={loading}
                  onClick={handleSignup}
                >
                  Resend email
                </Button>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs text-primary-light hover:underline"
                >
                  Use different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-center">
                Create Account
              </h2>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                label="Email"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-center text-xs text-muted">
                Already have an account?{" "}
                <Link href="/login" className="text-primary-light hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
