// controllers/blog-like.controller.ts
import { Context } from "hono";

import { getDb } from "../../db/db.service";
import { blogs, blogLikes } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";

export const checkBlogLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const blogId = c.req.param("id");
    const { fingerprint } = await c.req.json();

    if (!blogId) {
      return c.json(
        {
          success: false,
          message: "Blog ID is required",
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

    // Check if blog exists and get like count
    const existingBlog = await db
      .select({
        id: blogs.id,
        likeCount: blogs.likeCount,
      })
      .from(blogs)
      .where(eq(blogs.id, blogId))
      .limit(1);

    if (existingBlog.length === 0) {
      return c.json(
        {
          success: false,
          message: "Blog not found",
        },
        404
      );
    }

    // Check if user has liked
    const existingLike = await db
      .select({ id: blogLikes.id })
      .from(blogLikes)
      .where(
        and(
          eq(blogLikes.blogId, blogId),
          eq(blogLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    return c.json(
      {
        success: true,
        message: "Like status retrieved successfully",
        data: {
          liked: existingLike.length > 0,
          likeCount: existingBlog[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error checking blog like:", error);
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

export const toggleBlogLike = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const blogId = c.req.param("id");
    const { fingerprint } = await c.req.json();

    if (!blogId) {
      return c.json(
        {
          success: false,
          message: "Blog ID is required",
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

    const existingBlogs = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(eq(blogs.id, blogId))
      .limit(1);

    if (existingBlogs.length === 0) {
      return c.json(
        {
          success: false,
          message: "Blog not found",
        },
        404
      );
    }

    const existingLike = await db
      .select({ id: blogLikes.id })
      .from(blogLikes)
      .where(
        and(
          eq(blogLikes.blogId, blogId),
          eq(blogLikes.fingerprint, fingerprint)
        )
      )
      .limit(1);

    if (existingLike.length > 0) {
      return c.json(
        {
          success: false,
          message: "You have already liked this blog",
        },
        400
      );
    }

    await db.insert(blogLikes).values({
      blogId,
      fingerprint,
      userAgent,
    });

    // increment like count
    await db
      .update(blogs)
      .set({
        likeCount: sql`${blogs.likeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, blogId));

    const updatedBlog = await db
      .select({ likeCount: blogs.likeCount })
      .from(blogs)
      .where(eq(blogs.id, blogId))
      .limit(1);

    return c.json(
      {
        success: true,
        message: "Blog liked successfully",
        data: {
          likeCount: updatedBlog[0].likeCount,
        },
      },
      200
    );
  } catch (error) {
    console.error("Error adding blog like:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add like",
      },
      500
    );
  }
};
export const getBlogLikes = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const slug = c.req.param("slug");

    if (!slug) {
      return c.json({ success: false, message: "Slug is required" }, 400);
    }

    const blog = await db
      .select({ likeCount: blogs.likeCount })
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1);

    if (blog.length === 0) {
      return c.json({ success: false, message: "Blog not found" }, 404);
    }

    return c.json({
      success: true,
      data: { likeCount: blog[0].likeCount },
    });
  } catch (error) {
    console.error("Error fetching blog likes:", error);
    return c.json({ success: false, message: "Failed to fetch likes" }, 500);
  }
};
