import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../store/AppStore";

export function RequireAuth({ children }: { children?: React.ReactNode }) {
  const { session } = useApp();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RedirectIfAuthenticated({ children }: { children?: React.ReactNode }) {
  const { session } = useApp();

  if (session) {
    return <Navigate to="/app" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
