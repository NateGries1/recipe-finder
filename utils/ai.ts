import { GoogleGenAI } from "@google/genai";
import { AIMessage } from "@/types/aiMessage";
import { retryAsync } from "./retry";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CategoryMappingSchema = z.object({
  autoAdd: z.array(z.string()).max(15),
  consider: z.array(z.string()).max(15),
});
type IngredientTags = z.infer<typeof CategoryMappingSchema>;

export async function getIngredientTags(
  recipeName: string,
  existingIngredients: string[],
  MAX_RETRIES = 3,
): Promise<IngredientTags> {
  const prompt = JSON.stringify({
    recipeName,
    existingIngredients,
  });

  const aiResponse = await retryAsync<string>({
    retries: MAX_RETRIES,
    fn: async () => {
      const instructions = `Return ONLY valid JSON. Do not wrap the response in markdown or include explanations.

You are helping categorize ingredients for a recipe database.

Given:
- A recipe name.
- A list of existing ingredient names.

Your task is to infer the ingredients that would most likely appear in a typical version of the recipe.

Rules:
1. Prefer ingredient names from the provided ingredient list whenever an equivalent exists.
2. Do not invent a new ingredient if an existing ingredient is an obvious match, unless they are not the same.
3. Categorize ingredients based on how likely they are to appear in a typical recipe with this name.
- "autoAdd": Ingredients that are highly likely to appear in most recipes with this name. These do not need to be defining ingredients, only common.
- "consider": Ingredients that are commonly used but have lower confidence, vary by recipe, or are optional.
4. If a relevant ingredient is missing from the provided list of existing ingredients, still place it into one of the two categories.
5. Do not include duplicate ingredients.
6. Do not include ingredient quantities.
7. Do not include cooking equipment.
8. Do not include preparation methods.
9. Use singular or plural ingredient names based on what's popular for most recipes.
10. All relevant ingredients should be in either the "autoAdd" or "consider" categories, not both and not none.
11. Keep ingredient names concise and consistent.

Return exactly this JSON schema:

{
  "autoAdd": [
    "ingredient"
  ],
  "consider": [
    "ingredient"
  ]
}`;
      return await askAI(prompt, instructions);
    },
    validate: (text) => {
      try {
        const parsed = JSON.parse(text);
        return CategoryMappingSchema.safeParse(parsed).success;
      } catch {
        return false;
      }
    },
    onRetry: (error: unknown, attempt: number) => {
      console.warn(
        `getIngredientTags retry #${attempt + 1}`,
        error instanceof Error ? error.message : error,
      );
    },
  });

  if (aiResponse) {
    const ingredients = CategoryMappingSchema.parse(JSON.parse(aiResponse));
    return ingredients;
  } else {
    return { autoAdd: [], consider: [] };
  }
}

export const askAI = async (
  prompt: string,
  instructions?: string,
  history: AIMessage[] = [],
): Promise<string> => {
  try {
    console.log("Asking AI:", prompt);
    console.log("with history:", history);
    const chat = await ai.chats.create({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: instructions,
        responseMimeType: "application/json",
      },
      history: history,
    });
    console.log("Created chat");

    // Send the user message
    const response = await chat.sendMessage({ message: prompt });
    console.log("Text:", response.text);
    return response.text as string;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
