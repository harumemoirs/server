import { Context } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { poems } from "../../db/schema";
import { getDb } from "../../db/db.service";
import * as dotenv from "dotenv";
import {
  uploadToCloudinary,
  deleteImageFromCloudinary,
} from "../../config/cloudinary.helper";
import { extractPublicIdFromUrl } from "../../config/cloudinary.helper";
import { admins } from "../../db/schema";
dotenv.config();

export const addPoem = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const adminId = c.get("adminId");
    if (!adminId) {
      return c.json(
        {
          success: false,
          message: "Admin Id not found",
        },
        401
      );
    }
    const body = await c.req.parseBody();

    const { title, content, slug, synopsis } = body;

    if (!title || !content || !slug || !synopsis) {
      return c.json(
        {
          success: false,
          message: "Title, content, slug, and adminId are required",
        },
        400
      );
    }

    const verifyAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);
    if (verifyAdmin.length === 0) {
      return c.json(
        {
          success: false,
          message: "Admin not found",
        },
        404
      );
    }
    const image = body.image as File | undefined;

    const images = [image].filter(
      (item): item is File => item instanceof File
    );

    let imageUrls: string[] = [];
    if (images.length > 0) {
      if (!c.env.CLOUDINARY_NAME || !c.env.CLOUDINARY_API_KEY) {
        return c.json(
          {
            success: false,
            message: "Cloudinary configuration is missing",
          },
          500
        );
      }

      const useSignedUpload = !!c.env.CLOUDINARY_SECRET_KEY;

      if (!useSignedUpload && !c.env.CLOUDINARY_PRESET) {
        return c.json(
          {
            success: false,
            message:
              "Either CLOUDINARY_PRESET or CLOUDINARY_SECRET_KEY is required",
          },
          500
        );
      }

      try {
        imageUrls = await Promise.all(
          images.map((file) =>
            uploadToCloudinary(file, {
              cloudName: c.env.CLOUDINARY_NAME,
              apiKey: c.env.CLOUDINARY_API_KEY,
              uploadPreset: c.env.CLOUDINARY_PRESET,
              folder: "poems",
              sign: useSignedUpload,
              apiSecret: c.env.CLOUDINARY_SECRET_KEY,
            })
          )
        );
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return c.json(
          {
            success: false,
            message: `Image upload failed: ${
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown error"
            }`,
          },
          500
        );
      }
    }

    const poemData = {
      title: body.title as string,
      content: body.content as string,
      slug: body.slug as string,
      synopsis: body.synopsis as string,
      imageUrls,

      adminId:adminId as string,
    };

    const newBlog = await db.insert(poems).values(poemData).returning();

    return c.json(
      {
        success: true,
        message: "Poem created successfully",
        data: newBlog[0],
      },
      201
    );
  } catch (error) {
    console.error("Error creating poem:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create poem",
      },
      500
    );
  }
};

export const editPoem = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    const adminId = c.get("adminId");
    
  
    if (!adminId) {
      return c.json({
        success: false,
        message: "Unauthorized"
      }, 401);
    }
    
    const verifyAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);
      
    if (verifyAdmin.length === 0) {
      return c.json({
        success: false,
        message: "Admin not found"
      }, 404);
    }
     
    if (!id) {
      return c.json({ 
        success: false, 
        message: "Poem ID is required" 
      }, 400);
    }
 
    const existingPoem = await db
      .select()
      .from(poems)
      .where(eq(poems.id, id))
      .limit(1);
      
    if (existingPoem.length === 0) {
      return c.json({ 
        success: false, 
        message: "Poem not found" 
      }, 404);
    }

 
    const body = await c.req.parseBody();
 
    const title = typeof body.title === "string" ? body.title : undefined;
    const content = typeof body.content === "string" ? body.content : undefined;
    const slug = typeof body.slug === "string" ? body.slug : undefined;
    const synopsis = typeof body.synopsis === "string" ? body.synopsis : undefined;
    const replaceImages = typeof body.replaceImages === "string" 
      ? body.replaceImages 
      : "false";
    
 
    const image = body.image instanceof File ? body.image : undefined;
    
 
    let imageUrls: string[] = existingPoem[0].imageUrls || [];

 
    if (image) {
 
      if (!c.env.CLOUDINARY_NAME || !c.env.CLOUDINARY_API_KEY) {
        return c.json({
          success: false,
          message: "Cloudinary configuration is missing",
        }, 500);
      }

      const useSignedUpload = !!c.env.CLOUDINARY_SECRET_KEY;
      
      if (!useSignedUpload && !c.env.CLOUDINARY_PRESET) {
        return c.json({
          success: false,
          message: "Either CLOUDINARY_PRESET or CLOUDINARY_SECRET_KEY is required",
        }, 500);
      }

      try {
   
        const newImageUrl = await uploadToCloudinary(image, {
          cloudName: c.env.CLOUDINARY_NAME,
          apiKey: c.env.CLOUDINARY_API_KEY,
          uploadPreset: c.env.CLOUDINARY_PRESET,
          folder: "poem",
          sign: useSignedUpload,
          apiSecret: c.env.CLOUDINARY_SECRET_KEY,
        });

 
        if (replaceImages === "true") {
         
          if (imageUrls.length > 0 && c.env.CLOUDINARY_SECRET_KEY) {
            const deletePromises = imageUrls.map((url) =>
              deleteImageFromCloudinary(extractPublicIdFromUrl(url), {
                cloudName: c.env.CLOUDINARY_NAME,
                apiKey: c.env.CLOUDINARY_API_KEY,
                apiSecret: c.env.CLOUDINARY_SECRET_KEY,
              })
            );
            
        
            Promise.all(deletePromises).catch(err => 
              console.error("Failed to delete old images:", err)
            );
          }
          
      
          imageUrls = [newImageUrl];
        } else {
     
          imageUrls = [...imageUrls, newImageUrl];
        }
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return c.json({
          success: false,
          message: `Image upload failed: ${
            uploadError instanceof Error ? uploadError.message : "Unknown error"
          }`,
        }, 500);
      }
    }
 
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (slug !== undefined) updateData.slug = slug;
    if (synopsis !== undefined) updateData.synopsis = synopsis;
    
   
    if (image) {
      updateData.imageUrls = imageUrls;
    }

 
    const updatedPoem = await db
      .update(poems)
      .set(updateData)
      .where(eq(poems.id, id))
      .returning();

    return c.json({
      success: true,
      message: "Blog updated successfully",
      data: updatedPoem[0],
    }, 200);
    
  } catch (error) {
    console.error("Error updating letter:", error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update letter",
    }, 500);
  }
};

export const getAllPoems = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);

    const page = Number(c.req.query("page") ?? 1);
    const limit = Number(c.req.query("limit") ?? 10);
    const offset = (page - 1) * limit;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(poems);

    const poemList = await db
      .select()
      .from(poems)
      .orderBy(desc(poems.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      success: true,
      data: poemList,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page * limit < count,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching poems:", error);
    return c.json({ success: false, message: "Failed to fetch poems" }, 500);
  }
};

export const getPoemBySlug = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const slug = c.req.param("slug");

    if (!slug)
      return c.json({ success: false, message: "Slug is required" }, 400);

    const poem = await db
      .select()
      .from(poems)
      .where(eq(poems.slug, slug))
      .limit(1);

    if (poem.length === 0)
      return c.json({ success: false, message: "Blog not found" }, 404);

    return c.json({ success: true, data: poem[0] });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return c.json({ success: false, message: "Failed to fetch blog" }, 500);
  }
};

export const getPoemById = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param("id");

    if (!id) return c.json({ success: false, message: "ID is required" }, 400);

    const poem = await db.select().from(poems).where(eq(poems.id, id)).limit(1);

    if (poem.length === 0)
      return c.json({ success: false, message: "Blog not found" }, 404);

    return c.json({ success: true, data: poem[0] });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return c.json({ success: false, message: "Failed to fetch blog" }, 500);
  }
};

export const removePoem = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const body = await c.req.json();
    const {poemId} = body;
    if (!poemId)
      return c.json({ success: false, message: "Poem ID is required" }, 400);
    const adminId = c.get("adminId");
    if (!adminId) {
      return c.json(
        {
          success: false,
          message: "Unauthorized access",
        },
        401
      );
    }
      const verifyAdmin = await db.select().from(admins).where(eq(admins.id,adminId)).limit(1)
    if(verifyAdmin.length === 0 ){
      return c.json({
        success:false,
        message:"Admin not found"
      },404)
    }
    const existingPoem = await db
      .select()
      .from(poems)
      .where(eq(poems.id, poemId))
      .limit(1);
    if (existingPoem.length === 0)
      return c.json({ success: false, message: "Blog not found" }, 404);

    const imageUrls = existingPoem[0].imageUrls || [];
    if (imageUrls.length > 0 && c.env.CLOUDINARY_SECRET_KEY) {
      const deletePromises = imageUrls.map((url) =>
        deleteImageFromCloudinary(extractPublicIdFromUrl(url), {
          cloudName: c.env.CLOUDINARY_NAME,
          apiKey: c.env.CLOUDINARY_API_KEY,
          apiSecret: c.env.CLOUDINARY_SECRET_KEY,
        })
      );
      Promise.all(deletePromises).catch(console.error);
    }

    await db.delete(poems).where(eq(poems.id, poemId));
    return c.json({ success: true, message: "Poem deleted successfully" });
  } catch (error) {
    console.error("Error deleting poem:", error);
    return c.json({ success: false, message: "Failed to delete poem" }, 500);
  }
};
