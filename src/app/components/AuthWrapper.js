"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLoggedIn } from "../utils/auth";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { FeatureExplorationProvider } from "../context/FeatureExplorationContext";

export default function AuthWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/invite",
    "/reset",
  ];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isLoggedIn();
      console.log("[Debug] Checking authentication, result:", authenticated);
      setIsAuthenticated(authenticated);
      setIsLoading(false);

      // If user is not authenticated and trying to access protected route
      if (!authenticated && !isPublicRoute) {
        console.log("[Debug] Unauthenticated and not public route, redirecting to login");
        console.log("[Debug] Redirecting to login due to unauthenticated access to protected route:", pathname);
        router.push("/login");
        return;
      }

      // If user is authenticated and trying to access login page, redirect to home
      if (authenticated && pathname === "/login") {
        console.log("[Debug] Authenticated but on login page, redirecting to home");
        console.log("[Debug] Redirecting to home due to authenticated access to login page:", pathname);
        router.push("/");
        return;
      }
    };

    checkAuth();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "userId" || e.key === "userEmail") {
        console.log("[Debug] Storage change detected, rechecking auth");
        console.log("[Debug] Rechecking authentication due to storage change:", e.key);
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname, router, isPublicRoute]);

  // Show loading state during initial authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center w-full">
        <div className="flex items-center space-x-2">
          <div className="w-20 h-20 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // For public routes (like login), render without sidebar/navbar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, render with sidebar/navbar only if authenticated
  if (isAuthenticated) {
    return (
      <FeatureExplorationProvider>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main
            className="flex-1 overflow-auto"
            style={{ paddingLeft: "var(--sidebar-width, 4rem)" }}
          >
            {children}
          </main>
        </div>
      </FeatureExplorationProvider>
    );
  }

  // This shouldn't happen due to the redirect above, but just in case
  return null;
}
