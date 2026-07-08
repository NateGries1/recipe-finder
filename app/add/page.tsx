"use client";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useEffectEvent, useState } from "react";
import { Recipe, Section } from "@/types/database";
import { Folder, Utensils, Book } from "@/components/Icons";

const supabase = createClient();

type View = "loggedOut" | "loggedIn" | "addRecipe" | "addSection";

export default function Find() {
  const [view, setView] = useState<View>("loggedOut");
  const [sections, setSections] = useState<Section[]>([]);
  const [passwordError, setPasswordError] = useState<string>("");
  const [sectionInput, setSectionInput] = useState<string>("");
  const [showSectionOptions, setShowSectionOptions] = useState<boolean>(false);
  const [recipeSuccess, setRecipeSuccess] = useState<string>("");
  const [recipeError, setRecipeError] = useState<string>("");

  const fetchSections = async () => {
    const { data, error } = await supabase.from("Sections").select("*");
    if (error) console.error(error);
    setSections(data ?? []);
  };

  const handleLogin = async (e: FormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.NEXT_PUBLIC_AUTH_EMAIL ?? "",
      password: e.get("password") as string,
    });
    if (error) setPasswordError(error.message);
    else setView("loggedIn");
  };

  const handleAddSection = async (e: FormData) => {
    const { error } = await supabase
      .from("Sections")
      .upsert({ name: e.get("name") });
    if (error) console.error(error);
    else fetchSections();
  };

  const handleAddRecipe = async (e: FormData) => {
    let section: Section | null = null;

    const { data: existing } = await supabase
      .from("Sections")
      .select("*")
      .eq("name", e.get("section"))
      .single();

    if (existing) {
      const { data } = await supabase
        .from("Sections")
        .update({ num_pages: existing.num_pages + 1 })
        .eq("id", existing.id)
        .select()
        .single();
      section = data;
    } else {
      const { data } = await supabase
        .from("Sections")
        .insert({ name: e.get("section"), num_pages: 1 })
        .select()
        .single();
      section = data;
    }

    if (!section) return;

    const { data, error } = await supabase
      .from("Recipes")
      .insert({
        name: e.get("name"),
        section_id: section.id,
        page_number: section.num_pages,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setRecipeError(
        "Issue adding recipe. Please text me and I'll figure out the problem.",
      );
    } else {
      let message = `Recipe added! Put ${e.get("name")} at the back of the ${section.name} section and label it page #${section.num_pages}.`;
      if (!existing)
        message += ` Make sure to add the '${section.name}' section tab first!`;
      setRecipeSuccess(message);
    }
    fetchSections();
    setSectionInput("");
  };

  // Check auth with current state to change view
  const onAuthChange = useEffectEvent((event: string, session: any) => {
    if (event === "INITIAL_SESSION" && session) setView("loggedIn");
    if (event === "SIGNED_IN" && view === "loggedOut") setView("loggedIn");
    if (event === "SIGNED_OUT") setView("loggedOut");
  });

  // Add auth listener on mount
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      onAuthChange(event, session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Set sections on mount
  useEffect(() => {
    fetchSections();
  }, []);

  // Suggested sections for adding new recipe
  const filteredSections = sections.filter((s) =>
    s.name?.toLowerCase().includes(sectionInput.toLowerCase()),
  );

  const views: Record<View, React.ReactNode> = {
    loggedOut: (
      <div className="w-full flex-1 px-4 flex flex-col justify-center gap-y-4 p-4 text-center">
        <h1 className="text-2xl md:text-3xl">
          Log in before adding new recipes or sections.
        </h1>
        <form
          className="flex flex-col items-center justify-center gap-y-2 text-2xl"
          action={handleLogin}
        >
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            className="w-[80vw] max-w-[300px] text-2xl border-styles caret-gray-400 px-3"
          />
          {passwordError && (
            <p className="text-red-500 text-xl">{passwordError}</p>
          )}
          <button type="submit">Login</button>
        </form>
      </div>
    ),

    loggedIn: (
      <div className="flex-1 h-full flex flex-col sm:flex-row justify-center items-center gap-x-6.25 gap-y-8.5">
        <button
          className="flex items-center gap-x-1 sm:gap-x-2 px-12.5 py-2.5 light border-styles h-10 sm:h-12.5"
          onClick={() => setView("addRecipe")}
        >
          <Utensils className="w-4 md:w-6" strokeWidth="10" />
          <p className="text-[16px] md:text-2xl text-center">Add Recipe</p>
        </button>
        <button
          className="flex items-center gap-x-1 sm:gap-x-2 px-12.5 py-2.5 light border-styles h-10 sm:h-12.5"
          onClick={() => setView("addSection")}
        >
          <Folder />
          <p className="text-[16px] md:text-2xl text-center">Add Section</p>
        </button>
      </div>
    ),

    addRecipe: (
      <div className="flex flex-col items-center pt-29">
        <h1 className="text-xl sm:text-[32px] text-center mt-5 sm:mt-6">
          Add Recipe
        </h1>
        <h2 className="text-[14px] sm:text-xl font-light text-center mt-2 sm:mt-0 mx-15">
          Add a new recipe to your collection.
        </h2>
        <form
          action={handleAddRecipe}
          className="mt-11 flex flex-col rounded-2xl w-[clamp(350px,calc(350px+650*((100vw-393px)/1047)),1000px)] pr-[clamp(24px,calc(24px+32*((100vw-393px)/1047)),56px)] light pl-8 py-7 sm:py-9 text-[16px] sm:text-xl"
        >
          {/* Recipe Name */}
          <div className="flex gap-x-3 lg:gap-x-4">
            <Book
              className="w-10 h-10 md:w-12.5 md:h-12.5 rounded-full border-[1.5px] lg:border-2 border-(--dark-color)"
              border={true}
            />
            <div className="flex flex-col flex-1 gap-y-2 lg:gap-y-2.5">
              <label htmlFor="name">Recipe Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter recipe name"
                className="rounded-[10px] border border-(--dark-color) font-regular h-10 lg:h-12.5 px-3 w-full bg-transparent"
              />
            </div>
          </div>

          {/* Section */}
          <div className="flex gap-x-3 lg:gap-x-4 mt-5">
            <Folder
              className="w-10 h-10 md:w-12.5 md:h-12.5 border-[1.5px] lg:border-2 border-(--dark-color)"
              border={true}
            />
            <div className="flex flex-col flex-1 gap-y-2 lg:gap-y-2.5">
              <label htmlFor="section">Section Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="section"
                  value={sectionInput}
                  onChange={(e) => {
                    setSectionInput(e.target.value);
                    setShowSectionOptions(true);
                  }}
                  onFocus={() => setShowSectionOptions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSectionOptions(false), 150)
                  }
                  className="rounded-[10px] border border-(--dark-color) font-regular h-10 lg:h-12.5 px-3 w-full bg-transparent"
                  placeholder="Enter section name"
                />
                {showSectionOptions && (
                  <ul className="absolute z-10 w-full mt-1 rounded-[10px] border border-(--dark-color) bg-(--light-color) overflow-hidden">
                    {filteredSections.length > 0 ? (
                      filteredSections.map((section, i) => (
                        <li
                          key={i}
                          onMouseDown={() => {
                            setSectionInput(section.name ?? "");
                            setShowSectionOptions(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-(--dark-color) hover:text-(--light-color)"
                        >
                          {section.name}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 opacity-50">
                        No matching sections
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mx-auto mt-6 text-xl lg:text-2xl dark border-styles px-12.5 py-2.5"
          >
            Submit
          </button>
          {recipeSuccess && (
            <p className="mt-4 text-center text-[14px] sm:text-lg text-green-700">
              {recipeSuccess}
            </p>
          )}
        </form>
      </div>
    ),

    addSection: (
      <div className="flex flex-col items-center pt-29">
        <h1 className="text-xl sm:text-[32px] text-center mt-5 sm:mt-6">
          Add Section
        </h1>
        <h2 className="text-[14px] sm:text-xl font-light text-center mt-2 sm:mt-0 mx-15">
          Add a new section to your recipe binder.
        </h2>
        <form
          action={handleAddSection}
          className="mt-11 flex flex-col rounded-2xl w-[clamp(350px,calc(350px+650*((100vw-393px)/1047)),1000px)] pr-[clamp(24px,calc(24px+32*((100vw-393px)/1047)),56px)] light pl-8 py-7 sm:py-9 text-[16px] sm:text-xl"
        >
          <div className="flex gap-x-3 lg:gap-x-4">
            <Folder
              className="w-10 h-10 md:w-12.5 md:h-12.5 rounded-full border-[1.5px] lg:border-2 border-(--dark-color)"
              border={true}
            />
            <div className="flex flex-col flex-1 gap-y-2 lg:gap-y-2.5">
              <label htmlFor="name">Section Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter section name"
                className="rounded-[10px] border border-(--dark-color) font-regular h-10 lg:h-12.5 px-3 w-full bg-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="mx-auto mt-6 text-xl lg:text-2xl dark border-styles px-12.5 py-2.5"
          >
            Submit
          </button>
        </form>
      </div>
    ),
  };

  return (
    <div className="relative flex flex-col items-center flex-1">
      {(view === "addRecipe" || view === "addSection") && (
        <button
          className="absolute top-5 left-5 border-styles dark px-5 sm:px-7.5 py-2.5 text-[16px] sm:text-xl"
          onClick={() => setView("loggedIn")}
        >
          &lt; &nbsp; Back
        </button>
      )}
      {views[view]}
    </div>
  );
}
