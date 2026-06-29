"use client";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!loggedIn) return null;

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b">
      <p className="font-bold">Recipes</p>
      <button
        onClick={handleLogout}
        className="border-styles px-4 py-1 text-sm"
      >
        Logout
      </button>
    </nav>
  );
}
