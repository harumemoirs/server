import { Context } from "hono";
import { eq, sql,desc } from "drizzle-orm";
import { admins, blogs } from "../../db/schema";
import { getDb } from "../../db/db.service";
import * as dotenv from "dotenv";
import {
  uploadToCloudinary,
  deleteImageFromCloudinary,
} from "../../config/cloudinary.helper";
import { extractPublicIdFromUrl } from "../../config/cloudinary.helper";

dotenv.config();

 
export const addBlog = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const adminId = c.get("adminId");

    if (!adminId) {
      return c.json({
        success: false,
        message: "Admin authentication failed",
      }, 401);
    }

     
    const body = await c.req.parseBody();

    const title = body.title as string;
    const content = body.content as string;
    const slug = body.slug as string;
    const synopsis = body.synopsis as string ;
     if (!title || !content || !slug ||!synopsis) {
      return c.json({
        success: false,
        message: "Title, content, and slug are required",
      }, 400);
    }
    const verifyAdmin = await db.select().from(admins).where(eq(admins.id,adminId)).limit(1)
    if(verifyAdmin.length === 0 ){
      return c.json({
        success:false,
        message:"Admin not found"
      },404)
    }
    const image = body.image as File | undefined;
   
    const images = [image ].filter(
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
            message: "Either CLOUDINARY_PRESET or CLOUDINARY_SECRET_KEY is required",
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
              folder: "blogs",
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
            message: `Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`,
          },
          500
        );
      }
    }

    const blogData = {
      title: body.title as string,
      content: body.content as string,
      slug: body.slug as string,
      synopsis: body.synopsis as string,
      imageUrls,
      adminId: adminId as string,
    };

    const newBlog = await db.insert(blogs).values(blogData).returning();

    return c.json(
      {
        success: true,
        message: "Blog created successfully",
        data: newBlog[0],
      },
      201
    );
  } catch (error) {
    console.error("Error creating blog:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create blog",
      },
      500
    );
  }
};


export const editBlog = async (c: Context) => {
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
        message: "Blog ID is required" 
      }, 400);
    }
 
    const existingBlog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);
      
    if (existingBlog.length === 0) {
      return c.json({ 
        success: false, 
        message: "Blog not found" 
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
    
 
    let imageUrls: string[] = existingBlog[0].imageUrls || [];

 
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
          folder: "blogs",
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
    
    // Update imageUrls if we processed a new image
    if (image) {
      updateData.imageUrls = imageUrls;
    }

    // Perform database update
    const updatedBlog = await db
      .update(blogs)
      .set(updateData)
      .where(eq(blogs.id, id))
      .returning();

    return c.json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog[0],
    }, 200);
    
  } catch (error) {
    console.error("Error updating blog:", error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update blog",
    }, 500);
  }
};
 
export const getAllBlogs = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);

    
    const page = Number(c.req.query("page") ?? 1);  
    const limit = Number(c.req.query("limit") ?? 10);  
    const offset = (page - 1) * limit;

    
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(blogs);

    
    const blogsList = await db
      .select()
      .from(blogs)
      .orderBy(desc(blogs.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      success: true,
      data: blogsList,
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
    console.error("Error fetching blogs:", error);
    return c.json({ success: false, message: "Failed to fetch blogs" }, 500);
  }
};
 
export const getBlogBySlug = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const slug = c.req.param("slug");
    
    if (!slug)
      return c.json({ success: false, message: "Slug is required" }, 400);

    const blog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.slug, slug))
      .limit(1);
      
    if (blog.length === 0)
      return c.json({ success: false, message: "Blog not found" }, 404);

    return c.json({ success: true, data: blog[0] });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return c.json({ success: false, message: "Failed to fetch blog" }, 500);
  }
};

export const getBlogById = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param("id");
    
    if (!id)
      return c.json({ success: false, message: "ID is required" }, 400);

    const blog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, id))
      .limit(1);
      
    if (blog.length === 0)
      return c.json({ success: false, message: "Blog not found" }, 404);

    return c.json({ success: true, data: blog[0] });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return c.json({ success: false, message: "Failed to fetch blog" }, 500);
  }
};

 
export const removeBlog = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const body =await c.req.json();
    const {blogId} = body
    if (!blogId)
      return c.json({ success: false, message: "Blog ID is required" }, 400);
    const adminId = c.get("adminId")
    if(!adminId){
      return c.json({
        success:false,
        message:"Unautorized user"
      })
    }
    const verifyAdmin = await db.select().from(admins).where(eq(admins.id,adminId)).limit(1)
    if(verifyAdmin.length === 0){
      return c.json({
        success:false,
        message:"Admin not found"
      })
    }
    const existingBlog = await db
      .select()
      .from(blogs)
      .where(eq(blogs.id, blogId))
      .limit(1);
    if (existingBlog.length === 0)
      return c.json({ success: false, message: "Blog not found" }, 404);

    const imageUrls = existingBlog[0].imageUrls || [];
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

    await db.delete(blogs).where(eq(blogs.id, blogId));
    return c.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return c.json({ success: false, message: "Failed to delete blog" }, 500);
  }
};