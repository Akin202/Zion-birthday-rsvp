import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useRouter } from "../../lib/router";
import { eventConfig } from "../../config/event.config";
import { signIn } from "../../lib/auth";
import { AdminError } from "./AdminError";
import { Lock, Mail, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Set by RequireAuth when it bounced someone off a protected route. */
  const returnTo = (location.state as { from?: string } | null)?.from ?? "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await signIn(email, password);

    if (result.ok) {
      navigate(returnTo);
      return;
    }

    setError(result.message);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center items-center px-4 py-12 antialiased">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Website</span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white text-slate-900 rounded-xl shadow-xl p-8 border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-7 h-7 stroke-[2]" />
            </div>
            <h1 className="font-bold text-2xl text-slate-900">
              Admin Console Sign In
            </h1>
            <p className="text-xs text-slate-500">
              Authorized event staff & host portal for {eventConfig.celebrant.name}'s 7th Birthday
            </p>
          </div>

          {error && <AdminError variant="banner" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="adminEmail"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="adminEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="adminPassword"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="adminPassword"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm mt-2 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>{submitting ? "Signing in…" : "Sign In to Admin Dashboard"}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Access is limited to accounts created by {eventConfig.agency.name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
