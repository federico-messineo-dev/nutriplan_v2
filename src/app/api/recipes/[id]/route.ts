import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/recipes/[id] — delete a food item
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/recipes/[id] — update a food item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.kcalPer100g !== undefined && { kcalPer100g: body.kcalPer100g }),
      ...(body.proteinPer100g !== undefined && { proteinPer100g: body.proteinPer100g }),
      ...(body.carbPer100g !== undefined && { carbPer100g: body.carbPer100g }),
      ...(body.fatPer100g !== undefined && { fatPer100g: body.fatPer100g }),
      ...(body.dietTags !== undefined && { dietTags: JSON.stringify(body.dietTags) }),
      ...(body.allergens !== undefined && { allergens: JSON.stringify(body.allergens) }),
      ...(body.instructions !== undefined && { instructions: body.instructions }),
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
