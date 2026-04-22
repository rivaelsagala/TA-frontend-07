'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function AuthButton() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return session ? (
    <div className="flex items-center gap-4">
      <span className="text-sm">{session.user?.email}</span>

      <Button
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Logout
      </Button>

      <Button variant="outline" size="icon" onClick={toggleTheme}>
        {theme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    </div>
  ) : (
    <Button asChild variant="ghost">
      <Link href="/login">Login</Link>
    </Button>
  );
}
