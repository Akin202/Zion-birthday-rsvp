import { useEffect } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";

/**
 * Thin adapter over react-router so existing callers keep the `{ path, navigate }`
 * shape they were written against. Prefer react-router's own hooks in new code.
 */
export interface RouterApi {
  path: string;
  navigate: NavigateFunction;
}

export function useRouter(): RouterApi {
  const location = useLocation();
  const navigate = useNavigate();

  return { path: location.pathname, navigate };
}

/**
 * react-router preserves scroll position across navigations. The previous
 * hand-rolled router reset to top on every push, and the admin screens rely on
 * that (navigating from a scrolled guest list to Check-In must land at the top).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
