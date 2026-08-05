"use client";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useMemo, useState } from "react";
import {
  Recipe,
  Section,
  Cuisine,
  Difficulty,
  Ingredient,
  RecipeIngredient,
} from "@/types/database";
import { Search } from "@/components/Icons";
import SearchInput from "@/components/SearchInput";
import SelectButton from "@/components/SelectButton";

const supabase = createClient();

export default function Find() {
  const [query, setQuery] = useState<string>("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Keep raw rows around; derive the lookup Map via useMemo
  const [recipeIngredientRows, setRecipeIngredientRows] = useState<
    RecipeIngredient[]
  >([]);

  const recipeIngredientMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const row of recipeIngredientRows) {
      if (!map.has(row.recipe_id)) map.set(row.recipe_id, new Set());
      map.get(row.recipe_id)!.add(row.ingredient_id);
    }
    return map;
  }, [recipeIngredientRows]);

  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [ingredientQuery, setIngredientQuery] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>(
    [],
  );
  const [maxTime, setMaxTime] = useState<number | "">("");

  const handleSelect = async (option: Recipe) => {
    setSelected(option);

    if (option.section_id) {
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .eq("id", option.section_id)
        .single();

      if (error) console.error(error);
      setSelectedSection(data);
    }
  };

  useEffect(() => {
    async function fetchAll() {
      const [
        recipesRes,
        cuisinesRes,
        difficultiesRes,
        ingredientsRes,
        recipeIngredientRes,
      ] = await Promise.all([
        supabase.from("recipes").select("*"),
        supabase.from("cuisines").select("*"),
        supabase.from("difficulty").select("*"),
        supabase.from("ingredients").select("*"),
        supabase.from("recipe_ingredient").select("*"),
      ]);

      if (recipesRes.error) console.error(recipesRes.error);
      if (cuisinesRes.error) console.error(cuisinesRes.error);
      if (difficultiesRes.error) console.error(difficultiesRes.error);
      if (ingredientsRes.error) console.error(ingredientsRes.error);
      if (recipeIngredientRes.error) console.error(recipeIngredientRes.error);

      setRecipes(recipesRes.data ?? []);
      setCuisines(cuisinesRes.data ?? []);
      setDifficulties(difficultiesRes.data ?? []);
      setIngredients(ingredientsRes.data ?? []);
      setRecipeIngredientRows(recipeIngredientRes.data ?? []);
    }
    fetchAll();
  }, []);

  const recipeOptions = recipes.filter((r) =>
    r.name?.toLowerCase().includes(query.toLowerCase()),
  );

  const ingredientOptions = ingredients.filter(
    (ing) =>
      ing.name?.toLowerCase().includes(ingredientQuery.toLowerCase()) &&
      !selectedIngredients.some((sel) => sel.id === ing.id),
  );

  const addIngredient = (ing: Ingredient) => {
    setSelectedIngredients((prev) => [...prev, ing]);
    setIngredientQuery("");
  };

  const removeIngredient = (id: number) => {
    setSelectedIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const results = useMemo(() => {
    return recipes.filter((r) => {
      const matchesQuery = r.name?.toLowerCase().includes(query.toLowerCase());
      if (!matchesQuery) return false;

      if (selectedCuisine && r.cuisine_id !== selectedCuisine.id) {
        return false;
      }

      if (selectedDifficulty && r.difficulty_id !== selectedDifficulty.id) {
        return false;
      }

      if (selectedIngredients.length > 0) {
        const ingredientSet = recipeIngredientMap.get(r.id);
        const hasAll = selectedIngredients.every((ing) =>
          ingredientSet?.has(ing.id),
        );
        if (!hasAll) return false;
      }

      if (maxTime !== "" && r.total_cooking_time > (maxTime as number)) {
        return false;
      }

      return true;
    });
  }, [
    recipes,
    query,
    selectedCuisine,
    selectedDifficulty,
    selectedIngredients,
    maxTime,
    recipeIngredientMap,
  ]);

  return (
    <div className="flex flex-col items-center p-20">
      {/* Top: name + tag selection */}
      <div className="flex flex-col rounded-2xl w-[clamp(350px,calc(350px+650*((100vw-393px)/1047)),1000px)] px-[clamp(24px,calc(24px+32*((100vw-393px)/1047)),56px)] light pl-8 py-7 sm:py-9 text-[16px] sm:text-xl gap-y-4">
        <div>
          <p>Recipe Name</p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-[10px] border border-(--dark-color) font-regular h-10 lg:h-12.5 px-3 w-full bg-transparent"
            placeholder="Search recipe name"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col flex-1">
            <p>Cuisine</p>
            <SelectButton
              options={cuisines}
              value={selectedCuisine}
              onSelect={setSelectedCuisine}
              onClear={() => setSelectedCuisine(null)}
              placeholder="Any cuisine"
            />
          </div>

          <div className="flex flex-col flex-1">
            <p>Difficulty</p>
            <SelectButton
              options={difficulties}
              value={selectedDifficulty}
              onSelect={setSelectedDifficulty}
              onClear={() => setSelectedDifficulty(null)}
              placeholder="Any difficulty"
            />
          </div>

          <div className="flex flex-col flex-1">
            <p>Max Cooking Time (mins)</p>
            <input
              type="number"
              min={0}
              value={maxTime}
              onChange={(e) =>
                setMaxTime(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="rounded-[10px] border border-(--dark-color) h-10 lg:h-12.5 px-3 w-full bg-transparent"
              placeholder="Any"
            />
          </div>
        </div>

        <div>
          <p>Ingredients</p>
          <SearchInput
            query={ingredientQuery}
            onQueryChange={setIngredientQuery}
            options={ingredientOptions}
            onSelect={addIngredient}
            placeholder="Search ingredients"
            closeOnSelect={false}
          />

          {selectedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedIngredients.map((ing) => (
                <button
                  type="button"
                  key={ing.id}
                  onClick={() => removeIngredient(ing.id)}
                  className="px-3 py-1 rounded-full border border-(--dark-color) text-sm bg-(--dark-color) text-(--light-color)"
                >
                  {ing.name} ✕
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: recipe results */}
      <div className="mt-6 flex flex-col rounded-2xl w-[clamp(350px,calc(350px+650*((100vw-393px)/1047)),1000px)] px-[clamp(24px,calc(24px+32*((100vw-393px)/1047)),56px)] light pl-8 py-7 sm:py-9 text-[16px] sm:text-xl gap-y-2">
        <p className="font-light text-[14px] sm:text-lg opacity-60">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>
        <ul className="flex flex-col divide-y divide-(--dark-color)/20">
          {results.map((recipe) => (
            <li
              key={recipe.id}
              onClick={() => handleSelect(recipe)}
              className="py-2 cursor-pointer hover:opacity-70"
            >
              {recipe.name}
            </li>
          ))}
        </ul>
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
