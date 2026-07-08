"use client";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Recipe, Section } from "@/types/database";
import { Search } from "@/components/Icons";

const supabase = createClient();

export default function Find() {
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showRecipeOptions, setShowRecipeOptions] = useState<boolean>(false);

  const handleSelect = async (option: Recipe) => {
    setSelected(option);
    setShowRecipeOptions(false);

    if (option.section_id) {
      const { data, error } = await supabase
        .from("Sections")
        .select("*")
        .eq("id", option.section_id)
        .single();

      if (error) console.error(error);
      setSelectedSection(data);
    }
  };

  useEffect(() => {
    async function fetchAllRecipes() {
      const { data, error } = await supabase.from("Recipes").select("*");
      setRecipes(data ?? []);
    }
    fetchAllRecipes();
  }, []);

  const options = recipes.filter((r) =>
    r.name?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex flex-col items-center p-20">
      <div className="flex flex-col rounded-2xl w-[clamp(350px,calc(350px+650*((100vw-393px)/1047)),1000px)] px-[clamp(24px,calc(24px+32*((100vw-393px)/1047)),56px)] light pl-8 py-7 sm:py-9 text-[16px] sm:text-xl">
        <p>Recipe Name</p>
        <div className="relative">
          <input
            type="text"
            name="section"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowRecipeOptions(true);
            }}
            onFocus={() => setShowRecipeOptions(true)}
            onBlur={() => setTimeout(() => setShowRecipeOptions(false), 150)}
            className="rounded-[10px] border border-(--dark-color) font-regular h-10 lg:h-12.5 px-3 w-full bg-transparent"
            placeholder="Enter section name"
          />
          {showRecipeOptions && (
            <ul className="absolute z-10 w-full mt-1 rounded-[10px] border border-(--dark-color) bg-(--light-color) overflow-hidden">
              {options.map((recipe, i) => (
                <li
                  key={i}
                  onClick={(e) => handleSelect(recipe)}
                  className="px-3 py-2 cursor-pointer hover:bg-(--dark-color) hover:text-(--light-color)"
                >
                  {recipe.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {selected && selectedSection && (
        <div className="mt-6 flex flex-col rounded-2xl w-[clamp(350px,calc(350px+650*((100vw-393px)/1047)),1000px)] px-[clamp(24px,calc(24px+32*((100vw-393px)/1047)),56px)] light pl-8 py-7 sm:py-9 text-[16px] sm:text-xl gap-y-4">
          <div className="flex flex-col gap-y-1">
            <p className="font-light text-[14px] sm:text-lg opacity-60">
              Recipe
            </p>
            <p>{selected.name}</p>
          </div>
          <div className="flex flex-col gap-y-1">
            <p className="font-light text-[14px] sm:text-lg opacity-60">
              Section
            </p>
            <p>{selectedSection.name}</p>
          </div>
          <div className="flex flex-col gap-y-1">
            <p className="font-light text-[14px] sm:text-lg opacity-60">Page</p>
            <p>{selected.page_number}</p>
          </div>
        </div>
      )}
    </div>
  );
}
