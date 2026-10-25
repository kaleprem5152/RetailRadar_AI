import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../store/AppStore";

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { session, isAuthReady } = useApp();
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900 px-5">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="size-9 animate-spin rounded-full border-2 border-brass-400 border-t-transparent" />
          <p className="font-mono text-[11px] uppercase tracking-widest text-bone-400">
            Authenticating workspace session...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RedirectIfAuthenticated({ children }: { children?: React.ReactNode }) {
  const { session, isAuthReady } = useApp();

  if (!isAuthReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-900 px-5">
        <div className="size-8 animate-spin rounded-full border-2 border-brass-400 border-t-transparent" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/app" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
