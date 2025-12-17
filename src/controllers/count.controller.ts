import { sql } from "drizzle-orm";
import { getDb } from "../db/db.service";
import { blogs,journals,poems,letters } from "../db/schema";
import { Context } from "hono";
export const getTotalCount = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);

    const [
      blogsCount,
      journalsCount,
      poemsCount,
      lettersCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(blogs),
      db.select({ count: sql<number>`count(*)` }).from(journals),
      db.select({ count: sql<number>`count(*)` }).from(poems),
      db.select({ count: sql<number>`count(*)` }).from(letters),
    ]);

    return c.json({
      success: true,
      data: {
        blogs: blogsCount[0].count,
        journals: journalsCount[0].count,
        poems: poemsCount[0].count,
        letters: lettersCount[0].count
      },
    });
  } catch (error) {
    console.error("Post count error:", error);

    return c.json(
      {
        success: false,
        message: "Failed to fetch dashboard counts",
      },
      500
    );
  }
};
