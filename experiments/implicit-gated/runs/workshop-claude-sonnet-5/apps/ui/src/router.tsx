import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSnapshot() {
  return window.location.pathname;
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => "/");
}

interface NavigateContextValue {
  navigate: (path: string) => void;
}

const NavigateContext = createContext<NavigateContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const navigate = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return <NavigateContext.Provider value={{ navigate }}>{children}</NavigateContext.Provider>;
}

export function useNavigate(): (path: string) => void {
  const context = useContext(NavigateContext);
  if (!context) throw new Error("useNavigate must be used within a RouterProvider");
  return context.navigate;
}

export interface RouteLinkProps {
  to: string;
  className?: string;
  children: ReactNode;
}

export function RouteLink({ to, className, children }: RouteLinkProps) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function matchRoute(pathname: string, pattern: string): Record<string, string> | undefined {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return undefined;
  const params: Record<string, string> = {};
  for (const [index, part] of patternParts.entries()) {
    if (part.startsWith(":")) {
      params[part.slice(1)] = decodeURIComponent(pathParts[index]);
    } else if (part !== pathParts[index]) {
      return undefined;
    }
  }
  return params;
}
