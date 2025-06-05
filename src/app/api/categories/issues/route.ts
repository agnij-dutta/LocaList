import { NextRequest, NextResponse } from "next/server";
import { issueCategoryRepository } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const categories = await issueCategoryRepository.findMany({
      where: { isActive: true }
    });
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching issue categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await req.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await issueCategoryRepository.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      );
    }

    const category = await issueCategoryRepository.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating issue category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
} 