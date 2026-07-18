import { NextRequest, NextResponse } from "next/server";
import { getIngredientTags } from "@/utils/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { recipeName, existingIngredients } = body;

    if (typeof recipeName !== "string" || !Array.isArray(existingIngredients)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const result = await getIngredientTags(recipeName, existingIngredients);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ingredient tag error:", error);

    return NextResponse.json(
      { error: "Failed to generate ingredient tags" },
      { status: 500 },
    );
  }
}
