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

  const handleSelect = async (option: Recipe) => {
    setSelected(option);

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
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

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

  return (
    <div className="flex flex-col items-center p-20">
      <div className="flex justify-center gap-x-4">
        <label htmlFor="name">Search Recipe:</label>
        <input
          type="text"
          onChange={(e) => setQuery(e.target.value)}
          className="bg-white text-black text-3xl border-styles rounded-full"
        />
      </div>
      {query && (
        <ul>
          {options.map((option) => (
            <li key={option.id} onClick={() => handleSelect(option)}>
              {option.name}
            </li>
          ))}
        </ul>
      )}
      {selected && (
        <div>
          <p>{selected.name}</p>
          <p>
            {selectedSection?.name} {selected.page_number}
          </p>
        </div>
      )}
    </div>
  );
}
