"use client";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Recipe, Section } from "@/types/database";

const supabase = createClient();

export default function Find() {
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [options, setOptions] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [view, setView] = useState<
    "loggedOut" | "loggedIn" | "addRecipe" | "addSection"
  >("loggedOut");
  const [sections, setSections] = useState<Section[]>([]);

  const views = {
    loggedOut: (
      <form
        className="flex flex-col items-center justify-center gap-y-4"
        action={(e) => handleLogin(e)}
      >
        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          onChange={(e) => setQuery(e.target.value)}
          className="text-3xl border-styles caret-gray-400 font-semibold px-3"
        />
        {passwordError && (
          <p className="text-red-500 text-xl">{passwordError}</p>
        )}
        <button type="submit">Login</button>
      </form>
    ),
    loggedIn: (
      <div className="flex flex-col items-center justify-center gap-y-10">
        <button
          className="button-styles border-styles px-6 py-2"
          onClick={(e) => setView("addRecipe")}
        >
          Add Recipe
        </button>
        <button
          className="button-styles border-styles px-6 py-2"
          onClick={(e) => setView("addSection")}
        >
          Add Section
        </button>
      </div>
    ),
    addRecipe: (
      <form
        action={(e) => handleAddRecipe(e)}
        className="flex flex-col mx-auto content-between justify-center gap-y-2"
      >
        <div>
          <label htmlFor="name">Recipe Name</label>
          <input
            type="text"
            name="name"
            className="bg-white text-black text-xl"
          />
        </div>
        <div>
          <label htmlFor="name">Section</label>
          <select name="section" id="section">
            {sections.map((section, i) => (
              <option key={i} value={section.name}>
                {section.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Submit</button>
      </form>
    ),
    addSection: (
      <form
        action={(e) => handleAddSection(e)}
        className="flex flex-col items-center justify-center gap-y-10"
      >
        <div className="flex flex-col items-center gap-y-1">
          <label htmlFor="name" className="text-violet-900 text-center">
            Section Name
          </label>
          <input
            type="text"
            name="name"
            className="border-styles text-3xl px-3"
          />
        </div>
        <button
          type="submit"
          className="w-fit border-styles button-styles px-6 py-2 mx-auto"
        >
          Submit
        </button>
      </form>
    ),
  };

  const handleAddRecipe = async (e: FormData) => {
    let section: Section | null = null;

    const { data: existing } = await supabase
      .from("Sections")
      .select("*")
      .eq("name", e.get("section"))
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("Sections")
        .update({ num_pages: existing.num_pages + 1 })
        .eq("id", existing.id)
        .select()
        .single();
      section = data;
    } else {
      const { data, error } = await supabase
        .from("Sections")
        .insert({ name: e.get("section"), num_pages: 1 })
        .select()
        .single();
      section = data;
    }

    if (!section) return;

    const page_number = section.num_pages + 1;

    const { data, error } = await supabase
      .from("Recipes")
      .insert({
        name: e.get("name"),
        section_id: section.id,
        page_number,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(
        "Issue adding recipe. Please text me and I'll figure out the problem.",
      );
    } else {
      let message = `Recipe added successfully! Please put the recipe at the back of the ${section.name} section and label it page #${data.page_number}`;
      if (!existing)
        message += `Make sure to add the ${section.name} section first!`;
      alert(message);
    }
  };

  const handleAddSection = async (e: FormData) => {
    const { data, error } = await supabase
      .from("Sections")
      .upsert({ name: e.get("name") });

    if (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setView(session ? "loggedIn" : "loggedOut");
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const lookupSections = async () => {
      const { data, error } = await supabase.from("Sections").select("*");

      if (error) console.error(error);
      setSections(data ?? []);
    };
    lookupSections();
  });

  useEffect(() => {
    const lookupRecipe = async () => {
      const { data, error } = await supabase
        .from("Recipes")
        .select("*")
        .ilike("name", `%${debouncedQuery}%`);

      if (error) console.error(error);
      setOptions(data ?? []);
    };
    lookupRecipe();
  }, [debouncedQuery]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setLoggedIn(true);
    });
  }, []);

  const handleLogin = async (e: FormData) => {
    const password = e.get("password") as string;
    const { error } = await supabase.auth.signInWithPassword({
      email: "nategries1@gmail.com",
      password,
    });
    if (error) {
      setPasswordError(error.message);
    } else {
      setView("loggedIn");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-20">
      {views[view]}
    </div>
  );
}
