import React, { useState } from "react";
import { useRouter } from "../../lib/router";
import { eventConfig } from "../../config/event.config";
import { Lock, Mail, ShieldCheck, ArrowLeft } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const [email, setEmail] = useState("admin@hero-hq.com");
  const [password, setPassword] = useState("••••••••");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(claude-code): wire to Supabase Auth
    navigate("/admin");
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
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors shadow-sm mt-2"
            >
              Sign In to Admin Dashboard
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Note: Front-end demo authentication enabled for testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
