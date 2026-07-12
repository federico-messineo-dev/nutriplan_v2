import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTrainerId } from "@/lib/auth";

// GET /api/recipes — list all recipes (global + trainer's)
export async function GET() {
  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [{ trainerId: null }, { trainerId: { not: null } }],
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Parse JSON fields
  const result = recipes.map((r) => ({
    ...r,
    dietTags: JSON.parse(r.dietTags),
    allergens: JSON.parse(r.allergens),
  }));

  return NextResponse.json({ recipes: result });
}

// POST /api/recipes — create a new food item
export async function POST(req: NextRequest) {
  const trainerId = getTrainerId();
  const body = await req.json();

  const recipe = await prisma.recipe.create({
    data: {
      trainerId,
      name: body.name,
      category: body.category,
      kcalPer100g: body.kcalPer100g,
      proteinPer100g: body.proteinPer100g,
      carbPer100g: body.carbPer100g,
      fatPer100g: body.fatPer100g,
      dietTags: JSON.stringify(body.dietTags || []),
      allergens: JSON.stringify(body.allergens || []),
      instructions: body.instructions || null,
    },
  });

  return NextResponse.json({
    recipe: {
      ...recipe,
      dietTags: JSON.parse(recipe.dietTags),
      allergens: JSON.parse(recipe.allergens),
    },
  });
}
