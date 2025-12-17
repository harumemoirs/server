import { Context } from 'hono';
 
import { getDb } from '../../db/db.service';
import { letters, letterLikes } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const checkLetterLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param('id');
    const { fingerprint } = await c.req.json();

    if (!id) {
      return c.json(
        {
          success: false,
          message: 'Letter title is required',
        },
        400
      );
    }

    if (!fingerprint) {
      return c.json(
        {
          success: false,
          message: 'Fingerprint is required',
        },
        400
      );
    }

     
    const existingLetter = await db
      .select({
        id: letters.id,
        likeCount: letters.likeCount,
      })
      .from(letters)
      .where(eq(letters.id, id))
      .limit(1);

    if (existingLetter.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Letter not found',
        },
        404
      );
    }

    
    const existingLike = await db
      .select({ id: letters.id })
      .from(letterLikes)
      .where(
        and(
          eq(letterLikes.letterId, id),
          eq(letterLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    return c.json(
      {
        success: true,
        message: 'Like status retrieved successfully',
        data: {
          liked: existingLike.length > 0,
          likeCount: existingLetter[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error('Error checking letter like:', error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check like status',
      },
      500
    );
  }
};

export const toggleLetterLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const letterId = c.req.param('id');
    const { fingerprint } = await c.req.json();

    if (!letterId) {
      return c.json(
        {
          success: false,
          message: 'Letter ID is required',
        },
        400
      );
    }

    if (!fingerprint) {
      return c.json(
        {
          success: false,
          message: 'Fingerprint is required',
        },
        400
      );
    }

    const headers = c.req.raw.headers;
    const userAgent = headers.get('user-agent') || null;

    
    const existingLetter = await db
      .select({ id: letters.id })
      .from(letters)
      .where(eq(letters.id, letterId))
      .limit(1);

    if (existingLetter.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Poem not found',
        },
        404
      );
    }

     
    const existingLike = await db
      .select({ id: letterLikes.id })
      .from(letterLikes)
      .where(
        and(
          eq(letterLikes.letterId, letterId),
          eq(letterLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    if (existingLike.length > 0) {
      return c.json(
        {
          success: false,
          message: 'You have already liked this letter',
        },
        400
      );
    }

   
      await db
        .update(letters)
        .set({
          likeCount: sql`${letters.likeCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(letters.id, letterId));
  
   
    const updatedLetter= await db
      .select({ likeCount: letters.likeCount })
      .from(letters)
      .where(eq(letters.id, letterId))
      .limit(1);

    return c.json(
      {
        success: true,
        message: 'Letter liked successfully',
        data: {
          likeCount: updatedLetter[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error('Error adding letter like:', error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add like',
      },
      500
    );
  } 
}; 

export const getLetterLikes = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const slug = c.req.param('slug');

    if (!slug) {
      return c.json({ success: false, message: 'Slug is required' }, 400);
    }

    const letter = await db
      .select({ likeCount: letters.likeCount })
      .from(letters)
      .where(eq(letters.slug, slug))
      .limit(1);

    if (letter.length === 0) {
      return c.json({ success: false, message: 'Letter not found' }, 404);
    }

    return c.json({
      success: true,
      data: { likeCount: letter[0].likeCount },
    });
  } catch (error) {
    console.error('Error fetching letter likes:', error);
    return c.json(
      { success: false, message: 'Failed to fetch likes' },
      500
    );
  }
};