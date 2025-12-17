import { Context } from "hono";
import { getDb } from "../db/db.service";
import { subscribers, blogs, journals, poems, letters } from "../db/schema";
import { desc, sql } from "drizzle-orm";

export const totalSubscribers = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscribers);

    return c.json(
      { totalSubscribers: result[0].count },
      200
    );

  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch subscribers count" }, 500);
  }
};


export const mostLikedBlog = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);

    const result = await db
      .select()
      .from(blogs)
      .orderBy(desc(blogs.likeCount))
      .limit(1);

    return c.json(
      { mostLikedBlog: result[0] || null },
      200
    );

  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch most liked blog" }, 500);
  }
};


export const mostLikedJournal = async (c: Context) => {
  try {
     const db = getDb(c.env.DATABASE_URL);

    const result = await db
      .select()
      .from(journals)
      .orderBy(desc(journals.likeCount))
      .limit(1);

    return c.json(
      { mostLikedJournal: result[0] || null },
      200
    );

  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to fetch most liked journal" }, 500);
  }
};

export const mostLikedPoem = async (c: Context) => {
  try {
     const db = getDb(c.env.DATABASE_URL);

    const result = await db
      .select()
      .from(poems)
      .orderBy(desc(poems.likeCount))
      .limit(1);

    return c.json(
      { mostLikedPoem: result[0] || null },
      200
    );

  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to get most liked poem" }, 500);
  }
};
 
export const mostLikedLetter = async (c: Context) => {
  try {
     const db = getDb(c.env.DATABASE_URL);

    const result = await db
      .select()
      .from(letters)
      .orderBy(desc(letters.likeCount))
      .limit(1);

    return c.json(
      { mostLikedLetter: result[0] || null },
      200
    );

  } catch (error) {
    console.error(error);
    return c.json({ error: "Failed to get most liked letter" }, 500);
  }
};
