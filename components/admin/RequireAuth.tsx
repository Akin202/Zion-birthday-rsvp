import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { getSession, onAuthChange } from "../../lib/auth";

/**
 * Route guard for the admin area.
 *
 * This is a usability guard, not the security boundary — RLS is. Someone who
 * bypasses this renders an admin shell whose every query returns nothing.
 *
 * The `checking` state matters: rendering the login page for the instant it
 * takes Supabase to rehydrate a stored session would bounce door staff to a
 * login form on every page load.
 */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then((current) => {
        if (!isMounted) return;
        setSession(current);
        setChecking(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error("[auth] session lookup failed:", err);
        setSession(null);
        setChecking(false);
      });

    // Keeps the guard honest after a token refresh or a sign-out in another tab.
    const unsubscribe = onAuthChange((next) => {
      if (!isMounted) return;
      setSession(next);
      setChecking(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <p className="text-sm font-semibold text-slate-500" role="status">
          Checking your session…
        </p>
      </div>
    );
  }

  if (!session) {
    // `replace` keeps the login page out of history, and `state` lets the login
    // form return staff to the page they actually wanted.
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};
