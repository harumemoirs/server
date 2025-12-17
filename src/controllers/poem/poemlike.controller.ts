// controllers/poem-like.controller.ts
import { Context } from "hono";

import { getDb } from "../../db/db.service";
import { poems, poemLikes } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const checkPoemLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const poemId = c.req.param("id");
    const { fingerprint } = await c.req.json();

    if (!poemId) {
      return c.json(
        {
          success: false,
          message: "Poem ID is required",
        },
        400
      );
    }

    if (!fingerprint) {
      return c.json(
        {
          success: false,
          message: "Fingerprint is required",
        },
        400
      );
    }
    const existingPoem = await db
      .select({
        id: poems.id,
        likeCount: poems.likeCount,
      })
      .from(poems)
      .where(eq(poems.id, poemId))
      .limit(1);

    if (existingPoem.length === 0) {
      return c.json(
        {
          success: false,
          message: "Poem not found",
        },
        404
      );
    }

    const existingLike = await db
      .select({ id: poemLikes.id })
      .from(poemLikes)
      .where(
        and(
          eq(poemLikes.poemId, poemId),
          eq(poemLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    return c.json(
      {
        success: true,
        message: "Like status retrieved successfully",
        data: {
          liked: existingLike.length > 0,
          likeCount: existingPoem[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error checking poem like:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to check like status",
      },
      500
    );
  }
};

export const togglePoemLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const poemId = c.req.param("id");
    const { fingerprint } = await c.req.json();

    if (!poemId) {
      return c.json(
        {
          success: false,
          message: "Poem ID is required",
        },
        400
      );
    }

    if (!fingerprint) {
      return c.json(
        {
          success: false,
          message: "Fingerprint is required",
        },
        400
      );
    }

    const headers = c.req.raw.headers;
    const userAgent = headers.get("user-agent") || null;

    const existingPoem = await db
      .select({ id: poems.id })
      .from(poems)
      .where(eq(poems.id, poemId))
      .limit(1);

    if (existingPoem.length === 0) {
      return c.json(
        {
          success: false,
          message: "Poem not found",
        },
        404
      );
    }

    const existingLike = await db
      .select({ id: poemLikes.id })
      .from(poemLikes)
      .where(
        and(
          eq(poemLikes.poemId, poemId),
          eq(poemLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    if (existingLike.length > 0) {
      return c.json(
        {
          success: false,
          message: "You have already liked this poem",
        },
        400
      );
    }

   
    await db.insert(poemLikes).values({
      poemId,
      fingerprint,
      userAgent,
    });

    
    await db
      .update(poems)
      .set({
        likeCount: sql`${poems.likeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(poems.id, poemId));

    
    const updatedPoem = await db
      .select({ likeCount: poems.likeCount })
      .from(poems)
      .where(eq(poems.id, poemId))
      .limit(1);

    return c.json(
      {
        success: true,
        message: "Poem liked successfully",
        data: {
          likeCount: updatedPoem[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error adding poem like:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add like",
      },
      500
    );
  }
};
export const getPoemLikes = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const slug = c.req.param("slug");

    if (!slug) {
      return c.json({ success: false, message: "Slug is required" }, 400);
    }

    const poem = await db
      .select({ likeCount: poems.likeCount })
      .from(poems)
      .where(eq(poems.slug, slug))
      .limit(1);

    if (poem.length === 0) {
      return c.json({ success: false, message: "Poem not found" }, 404);
    }

    return c.json({
      success: true,
      data: { likeCount: poem[0].likeCount },
    });
  } catch (error) {
    console.error("Error fetching poem likes:", error);
    return c.json({ success: false, message: "Failed to fetch likes" }, 500);
  }
};
