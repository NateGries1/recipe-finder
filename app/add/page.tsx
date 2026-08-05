"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useEffectEvent, useState } from "react";

import { Cuisine, Difficulty, Ingredient, Section } from "@/types/database";

import { Folder, Utensils, Book } from "@/components/Icons";
import SelectButton from "@/components/SelectButton";
import SearchInput from "@/components/SearchInput";

const supabase = createClient();

type View = "loggedOut" | "loggedIn" | "addRecipe" | "addSection";
type IngredientTags = {
  autoAdd: string[];
  consider: string[];
};

export default function Add() {
  const [view, setView] = useState<View>("loggedOut");

  // Database data
  const [sections, setSections] = useState<Section[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Auth
  const [passwordError, setPasswordError] = useState("");

  // Recipe fields
  const [recipeName, setRecipeName] = useState("");

  const [sectionInput, setSectionInput] = useState("");

  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);

  const [cuisineInput, setCuisineInput] = useState("");

  const [totalTime, setTotalTime] = useState<number | "">("");

  // Ingredient search
  const [ingredientQuery, setIngredientQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // AI tagging
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [considerTags, setConsiderTags] = useState<string[]>([]);
  const [tagging, setTagging] = useState(false);

  // Status
  const [recipeSuccess, setRecipeSuccess] = useState("");
  const [recipeError, setRecipeError] = useState("");

  // AddSection
  const [addSectionInput, setAddSectionInput] = useState<string>("");

  async function fetchData() {
    const [sectionsRes, cuisinesRes, difficultyRes, ingredientsRes] =
      await Promise.all([
        supabase.from("sections").select("*"),
        supabase.from("cuisines").select("*"),
        supabase.from("difficulty").select("*"),
        supabase.from("ingredients").select("*"),
      ]);

    if (sectionsRes.error) console.error(sectionsRes.error);

    if (cuisinesRes.error) console.error(cuisinesRes.error);

    if (difficultyRes.error) console.error(difficultyRes.error);

    if (ingredientsRes.error) console.error(ingredientsRes.error);

    setSections(sectionsRes.data ?? []);
    setCuisines(cuisinesRes.data ?? []);
    setDifficulties(difficultyRes.data ?? []);
    setIngredients(ingredientsRes.data ?? []);
  }

  async function handleLogin(formData: FormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.NEXT_PUBLIC_AUTH_EMAIL ?? "",
      password: formData.get("password") as string,
    });

    if (error) setPasswordError(error.message);
    else setView("loggedIn");
  }

  async function handleAutoTag() {
    if (!recipeName) return;

    setTagging(true);

    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeName,
          existingIngredients: ingredients.map((i) => i.name),
        }),
      });

      const data: IngredientTags = await res.json();

      setAutoTags(data.autoAdd ?? []);
      setConsiderTags(data.consider ?? []);

      const autoIngredients = data.autoAdd ?? [];

      setSelectedIngredients((prev) => {
        const existing = new Set(prev.map((i) => i.toLowerCase()));

        return [
          ...prev,
          ...autoIngredients.filter((i) => !existing.has(i.toLowerCase())),
        ];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setTagging(false);
    }
  }

  function selectExistingSection(section: Section) {
    setSectionInput(section.name);
  }

  function selectExistingCuisine(cuisine: Cuisine) {
    setCuisineInput(cuisine.name);
  }

  function addCuisine(cuisine: string) {
    setCuisineInput(cuisine);
  }

  function handleEnterIngredient() {
    if (ingredientQuery.trim() !== "") {
      addIngredient(ingredientQuery.trim());
      setIngredientQuery("");
    }
  }

  function addExistingIngredient(ingredient: Ingredient) {
    if (!selectedIngredients.some((i) => i === ingredient.name)) {
      setSelectedIngredients([...selectedIngredients, ingredient.name]);
    }
    setIngredientQuery("");
  }

  function addIngredient(ingredient: string) {
    if (!selectedIngredients.some((i) => i === ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
    setIngredientQuery("");
  }

  const filteredSections = sections.filter((section) =>
    section.name.toLowerCase().includes(sectionInput.toLowerCase()),
  );

  const ingredientOptions = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(ingredientQuery.toLowerCase()),
  );

  useEffect(() => {
    fetchData();
  }, []);

  const onAuthChange = useEffectEvent((event: string, session: any) => {
    if (event === "INITIAL_SESSION" && session) setView("loggedIn");

    if (event === "SIGNED_IN" && view === "loggedOut") setView("loggedIn");

    if (event === "SIGNED_OUT") setView("loggedOut");
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) =>
      onAuthChange(event, session),
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Selected ingredients:", selectedIngredients);
  }, [selectedIngredients]);

  async function getOrCreateSection(name: string): Promise<Section | null> {
    const { data: existing, error } = await supabase
      .from("sections")
      .select("*")
      .eq("name", name)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return null;
    }

    if (existing) {
      const { data, error } = await supabase
        .from("sections")
        .update({
          num_pages: existing.num_pages + 1,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        return null;
      }

      return data;
    }

    const { data, error: insertError } = await supabase
      .from("sections")
      .insert({
        name,
        num_pages: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return null;
    }

    return data;
  }

  async function getOrCreateCuisine(name: string): Promise<Section | null> {
    const { data: existing, error } = await supabase
      .from("cuisines")
      .select("*")
      .eq("name", name)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return null;
    }

    if (existing) {
      return existing;
    }

    const { data, error: insertError } = await supabase
      .from("cuisines")
      .insert({
        name,
      })
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return null;
    }

    return data;
  }

  async function getOrCreateIngredient(
    name: string,
  ): Promise<Ingredient | null> {
    const { data, error } = await supabase
      .from("ingredients")
      .upsert(
        {
          name,
        },
        {
          onConflict: "name",
        },
      )
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  }

  async function handleAddRecipe(formData: FormData) {
    setRecipeError("");
    setRecipeSuccess("");

    const name = recipeName.trim();

    if (!name) {
      setRecipeError("Recipe name is required.");
      return;
    }

    const section = await getOrCreateSection(sectionInput);

    if (!section) {
      setRecipeError("Could not create section.");
      return;
    }

    const cuisine = await getOrCreateCuisine(cuisineInput);

    if (!cuisine) {
      setRecipeError("Could not create cuisine.");
      return;
    }

    const ingredientRows = await Promise.all(
      selectedIngredients.map((ingredient) =>
        getOrCreateIngredient(ingredient),
      ),
    );

    const validIngredients = ingredientRows.filter(
      (ingredient): ingredient is Ingredient => ingredient !== null,
    );

    const { data: recipe, error } = await supabase
      .from("recipes")
      .insert({
        name: recipeName,
        section_id: section.id,
        cuisine_id: cuisine.id ?? null,
        difficulty_id: selectedDifficulty?.id ?? null,
        page_number: section.num_pages,
        total_cooking_time: totalTime,
      })
      .select()
      .single();

    if (error || !recipe) {
      console.error(error);
      setRecipeError("Issue adding recipe.");
      return;
    }

    const recipeIngredients = validIngredients.map((ingredient) => ({
      recipe_id: recipe.id,
      ingredient_id: ingredient.id,
    }));

    if (recipeIngredients.length > 0) {
      const { error: ingredientError } = await supabase
        .from("recipe_ingredient")
        .insert(recipeIngredients);

      if (ingredientError) {
        console.error(ingredientError);

        setRecipeError("Recipe added but ingredients failed.");

        return;
      }
    }

    setRecipeSuccess(
      `Recipe added! Put ${name} at the back of the ${section.name} section and label it page #${section.num_pages}.`,
    );

    setRecipeName("");
    setSectionInput("");
    setCuisineInput("");
    setSelectedDifficulty(null);
    setSelectedIngredients([]);
    setTotalTime("");
    setRecipeError("");

    setAutoTags([]);
    setConsiderTags([]);

    fetchData();
  }

  async function handleAddSection(formData: FormData) {
    const name = addSectionInput;

    const { error } = await supabase.from("sections").upsert(
      {
        name,
      },
      {
        onConflict: "name",
      },
    );

    if (error) console.error(error);

    setAddSectionInput("");

    fetchData();
  }

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
      <div className="flex-1 h-full flex flex-col sm:flex-row justify-center items-center gap-x-6 gap-y-8">
        <button
          className="flex items-center gap-x-2 px-12 py-2.5 light border-styles h-12.5 text-2xl"
          onClick={() => setView("addRecipe")}
        >
          <Utensils className="w-5" strokeWidth="10" />
          <p>Add Recipe</p>
        </button>

        <button
          className="flex items-center gap-x-2 px-12 py-2.5 light border-styles h-12.5 text-2xl"
          onClick={() => setView("addSection")}
        >
          <Folder />

          <p>Add Section</p>
        </button>
      </div>
    ),

    addRecipe: (
      <div className="flex flex-col items-center pt-20">
        <h1 className="text-xl sm:text-[32px] text-center">Add Recipe</h1>

        <h2 className="text-sm sm:text-xl font-light text-center mt-2">
          Add a new recipe to your collection.
        </h2>

        <form
          action={handleAddRecipe}
          className="mt-10 flex flex-col rounded-2xl w-[clamp(350px,calc(350px+650*((100vw-393px)/1047)),1000px)] light px-8 py-8 text-[16px] sm:text-xl gap-y-5"
        >
          {/* Name */}
          <div>
            <p>Recipe Name</p>

            <input
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="rounded-[10px] border border-(--dark-color) h-10 lg:h-12.5 px-3 w-full bg-transparent"
              placeholder="Enter recipe name"
            />
          </div>

          {/* Section */}

          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <p>Section</p>

              <div className="relative">
                <SearchInput
                  query={sectionInput}
                  onQueryChange={setSectionInput}
                  options={sections}
                  onSelect={selectExistingSection}
                  placeholder="Choose section"
                  addCurrentLabel="+ New"
                  handleEnter={(value: string) => setSectionInput(value)}
                  handleSelectCurrent={setSectionInput}
                />
              </div>
            </div>

            <div className="flex-1">
              <p>Cuisine</p>
              <SearchInput
                query={cuisineInput}
                onQueryChange={setCuisineInput}
                options={cuisines}
                onSelect={selectExistingCuisine}
                placeholder="Choose Cuisine"
                addCurrentLabel="+ New"
                handleEnter={setCuisineInput}
                handleSelectCurrent={setCuisineInput}
              />
            </div>
          </div>

          {/* Cuisine + Difficulty */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p>Difficulty</p>
              <SelectButton
                options={difficulties}
                value={selectedDifficulty}
                onSelect={setSelectedDifficulty}
                onClear={() => setSelectedDifficulty(null)}
                placeholder="Select difficulty"
              />
            </div>
            <div className="flex flex-col flex-1">
              <p>Total Cooking Time (min)</p>
              <input
                type="number"
                min={0}
                value={totalTime}
                onChange={(e) =>
                  setTotalTime(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="rounded-[10px] border border-(--dark-color) h-10 lg:h-12.5 px-3 w-full bg-transparent"
                placeholder="Any"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <p>Ingredients</p>

            <SearchInput
              query={ingredientQuery}
              onQueryChange={setIngredientQuery}
              options={ingredientOptions}
              onSelect={addExistingIngredient}
              placeholder="Search ingredients"
              addCurrentLabel="+ New"
              handleEnter={handleEnterIngredient}
              handleSelectCurrent={handleEnterIngredient}
            />

            {selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedIngredients.map((ingredient) => (
                  <button
                    type="button"
                    key={ingredient}
                    onClick={() =>
                      setSelectedIngredients(
                        selectedIngredients.filter((i) => i !== ingredient),
                      )
                    }
                    className="px-3 py-1 rounded-full border text-sm"
                  >
                    {ingredient} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Button */}
          <button
            type="button"
            onClick={handleAutoTag}
            disabled={tagging}
            className="dark border-styles px-8 py-2 mx-auto"
          >
            {tagging ? "Generating..." : "Auto Tag"}
          </button>

          {/* AI Suggestions */}
          {autoTags.length > 0 && (
            <div>
              <p>Suggested Ingredients</p>

              <div className="flex flex-wrap gap-2">
                {autoTags.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={selectedIngredients.includes(name)}
                    onClick={() => addIngredient(name)}
                    className={`
                      px-3 py-1 rounded-full border
                      ${
                        selectedIngredients.includes(name)
                          ? "opacity-50"
                          : "bg-transparent hover:bg-purple-50 cursor-pointer"
                      }
                    `}
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {considerTags.length > 0 && (
            <div>
              <p className="opacity-60">Consider</p>

              <div className="flex flex-wrap gap-2">
                {considerTags.map((name) => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => addIngredient(name)}
                    className={`
                      px-3 py-1 rounded-full border
                      ${
                        selectedIngredients.includes(name)
                          ? "opacity-50"
                          : "bg-transparent hover:bg-purple-50 cursor-pointer"
                      }
                    `}
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="mx-auto mt-3 text-xl dark border-styles px-12 py-2"
          >
            Submit
          </button>

          {recipeSuccess && (
            <p className="text-green-700 text-center">{recipeSuccess}</p>
          )}

          {recipeError && (
            <p className="text-red-500 text-center">{recipeError}</p>
          )}
        </form>
      </div>
    ),

    addSection: (
      <div className="flex flex-col items-center pt-20">
        <h1 className="text-xl sm:text-[32px]">Add Section</h1>
        <h2 className="text-sm sm:text-xl font-light text-center mt-2">
          Add a new section tab to your recipe collection.
        </h2>

        <form
          action={handleAddSection}
          className="mt-10 flex flex-col rounded-2xl light px-8 py-8 gap-y-5 text-xl"
        >
          <div>
            <p>Section Name</p>

            <input
              value={addSectionInput}
              onChange={(e) => setAddSectionInput(e.target.value)}
              className="rounded-[10px] border border-(--dark-color) h-10 lg:h-12.5 px-3 w-full bg-transparent"
              placeholder="Enter section name"
            />
          </div>

          <button type="submit" className="dark border-styles px-10 py-2">
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
          className="absolute top-5 left-5 border-styles px-5 py-2 text-2xl"
          onClick={() => setView("loggedIn")}
        >
          &lt; Back
        </button>
      )}

      {views[view]}
    </div>
  );
}
