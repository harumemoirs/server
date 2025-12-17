// controllers/journal-like.controller.ts
import { Context } from "hono";

import { getDb } from "../../db/db.service";
import { journals, journalLikes } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const checkJournalLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const journalId = c.req.param("id");
    const { fingerprint } = await c.req.json();

    if (!journalId) {
      return c.json(
        {
          success: false,
          message: "Journal ID is required",
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

    // Check if journal exists and get like count
    const existingJournal = await db
      .select({
        id: journals.id,
        likeCount: journals.likeCount,
      })
      .from(journals)
      .where(eq(journals.id, journalId))
      .limit(1);

    if (existingJournal.length === 0) {
      return c.json(
        {
          success: false,
          message: "Journal not found",
        },
        404
      );
    }

    // Check if user has liked
    const existingLike = await db
      .select({ id: journalLikes.id })
      .from(journalLikes)
      .where(
        and(
          eq(journalLikes.journalId, journalId),
          eq(journalLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    return c.json(
      {
        success: true,
        message: "Like status retrieved successfully",
        data: {
          liked: existingLike.length > 0,
          likeCount: existingJournal[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error checking journal like:", error);
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

export const toggleJournalLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const journalId = c.req.param("id");
    const { fingerprint } = await c.req.json();

    if (!journalId) {
      return c.json(
        {
          success: false,
          message: "Journal ID is required",
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

    const existingJournal = await db
      .select({ id: journals.id })
      .from(journals)
      .where(eq(journals.id, journalId))
      .limit(1);

    if (existingJournal.length === 0) {
      return c.json(
        {
          success: false,
          message: "Journal not found",
        },
        404
      );
    }

    const existingLike = await db
      .select({ id: journalLikes.id })
      .from(journalLikes)
      .where(
        and(
          eq(journalLikes.journalId, journalId),
          eq(journalLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    if (existingLike.length > 0) {
      return c.json(
        {
          success: false,
          message: "You have already liked this journal",
        },
        400
      );
    }

    await db.insert(journalLikes).values({
      journalId,
      fingerprint,
      userAgent,
    });

    await db
      .update(journals)
      .set({
        likeCount: sql`${journals.likeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(journals.id, journalId));

    
    const updatedJournal = await db
      .select({ likeCount: journals.likeCount })
      .from(journals)
      .where(eq(journals.id, journalId))
      .limit(1);

    return c.json(
      {
        success: true,
        message: "Journal liked successfully",
        data: {
          likeCount: updatedJournal[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error adding journal like:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add like",
      },
      500
    );
  }
};
export const getJournalLikes = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const slug = c.req.param("slug");

    if (!slug) {
      return c.json({ success: false, message: "Slug is required" }, 400);
    }

    const journal = await db
      .select({ likeCount: journals.likeCount })
      .from(journals)
      .where(eq(journals.slug, slug))
      .limit(1);

    if (journal.length === 0) {
      return c.json({ success: false, message: "Journal not found" }, 404);
    }

    return c.json({
      success: true,
      data: { likeCount: journal[0].likeCount },
    });
  } catch (error) {
    console.error("Error fetching journal likes:", error);
    return c.json({ success: false, message: "Failed to fetch likes" }, 500);
  }
};
