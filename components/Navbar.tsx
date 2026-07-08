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
    <nav className="flex items-center justify-between px-5 sm:px-8 py-4 border-b h-19 sm:h-21">
      <p className="text-xl sm:text-[32px]">Recipe Finder</p>
      <button
        onClick={handleLogout}
        className="border-styles px-5 sm:px-7.5 py-2.5 text-[16px] sm:text-xl"
      >
        Log out
      </button>
    </nav>
  );
}
