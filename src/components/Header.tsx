import { useState } from "react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: {
    email: string;
  };
}

export function Header({ user }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Clear local state and redirect to login
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <a href="/generate" className="text-xl font-bold">
            10x Cards
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="/generate"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Generate
            </a>
            <a
              href="/flashcards"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              My Flashcards
            </a>
            <a
              href="/study"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Study
            </a>
          </nav>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="gap-2"
          >
            <span className="text-sm">{user.email}</span>
            <svg
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 z-20 mt-2 min-w-56 max-w-xs rounded-md border bg-card shadow-lg">
                <div className="p-2">
                  <div className="px-2 py-1.5 text-sm text-muted-foreground border-b mb-1 pb-2 break-all">
                    {user.email}
                  </div>
                  <a
                    href="/profile"
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </a>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}