import { Context } from "hono";
import { eq ,sql,desc} from "drizzle-orm";
import { admins, letters } from "../../db/schema";
import { getDb } from "../../db/db.service";
import * as dotenv from "dotenv";
import { uploadToCloudinary,deleteImageFromCloudinary } from "../../config/cloudinary.helper";
import { extractPublicIdFromUrl } from "../../config/cloudinary.helper";
dotenv.config();
 
export const addLetter = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const adminId = c.get("adminId");

    if (!adminId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const body = await c.req.parseBody();

    const title = body.title as string;
    const content = body.content as string;
    const date = body.date as string;
    const slug = body.slug as string;
    const image = body.image instanceof File ? body.image : undefined;

    if (!title || !content || !date || !slug) {
      return c.json(
        { success: false, message: "Incomplete data" },
        400
      );
    }

    const adminExists = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);

    if (!adminExists.length) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const existingTitle = await db
      .select()
      .from(letters)
      .where(eq(letters.title, title))
      .limit(1);

    if (existingTitle.length) {
      return c.json(
        { success: false, message: "Letter title already exists" },
        409
      );
    }

    let imageUrls: string[] = [];

    if (image) {
      if (!c.env.CLOUDINARY_NAME || !c.env.CLOUDINARY_API_KEY) {
        return c.json(
          { success: false, message: "Cloudinary not configured" },
          500
        );
      }

      const useSigned = !!c.env.CLOUDINARY_SECRET_KEY;

      imageUrls.push(
        await uploadToCloudinary(image, {
          cloudName: c.env.CLOUDINARY_NAME,
          apiKey: c.env.CLOUDINARY_API_KEY,
          apiSecret: c.env.CLOUDINARY_SECRET_KEY,
          uploadPreset: c.env.CLOUDINARY_PRESET,
          folder: "letters",
          sign: useSigned,
        })
      );
    }

    const [newLetter] = await db
      .insert(letters)
      .values({
        title,
        content,
        date,
        slug,
        imageUrls,
        adminId,
      })
      .returning();

    return c.json(
      { success: true, message: "Letter created", data: newLetter },
      201
    );
  } catch (err) {
    console.error("Add Letter Error:", err);
    return c.json(
      { success: false, message: "Failed to create letter" },
      500
    );
  }
};
 

 
export const editLetter = async (c: Context) => {
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
        message: "Letter ID is required" 
      }, 400);
    }
 
    const existingLetter = await db
      .select()
      .from(letters)
      .where(eq(letters.id, id))
      .limit(1);
      
    if (existingLetter.length === 0) {
      return c.json({ 
        success: false, 
        message: "Letter not found" 
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
    
 
    let imageUrls: string[] = existingLetter[0].imageUrls || [];

 
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
          folder: "letter",
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

 
    const updatedLetter = await db
      .update(letters)
      .set(updateData)
      .where(eq(letters.id, id))
      .returning();

    return c.json({
      success: true,
      message: "Blog updated successfully",
      data: updatedLetter[0],
    }, 200);
    
  } catch (error) {
    console.error("Error updating letter:", error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update letter",
    }, 500);
  }
};
 
export const getAllLetters = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
      
        const page = Number(c.req.query("page") ?? 1);  
        const limit = Number(c.req.query("limit") ?? 10);  
        const offset = (page - 1) * limit;
    
        
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(letters);
    
        
        const letterList = await db
          .select()
          .from(letters)
          .orderBy(desc(letters.createdAt))
          .limit(limit)
          .offset(offset);
    
        return c.json({
          success: true,
          data: letterList,
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
    console.error("Error fetching letters:", error);
    return c.json({ success: false, message: "Failed to fetch letters" }, 500);
  }
};


export const getLetterById = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const id = c.req.param("id")
    const letter = await db
      .select()
      .from(letters)
      .where(eq(letters.id, id))
      .limit(1);
      
    if (letter.length === 0)
      return c.json({ success: false, message: "Letter not found" }, 404);

    return c.json({ success: true, data: letter[0] });
  } catch (error) {
    console.error("Error fetching letter:", error);
    return c.json({ success: false, message: "Failed to fetch letter" }, 500);
  }
};

export const getLetterByTitle = async (c:Context) => {
    try {
        const db = getDb(c.env.DATABASE_URL)
        const title = c.req.param("title")
        if(!title){
            return c.json({
                success:false,
                message:"Letter title is required"
            },400)
        }
        const letter = await db.select().from(letters).where(eq(letters.title,title)).limit(1)
        if(letter.length === 0){
            return c.json({
                success:false,
                message:"Letter not found"
            },404)
        }
        return c.json({
            success:true,
            data:letter[0]
        },200)

    } catch (error) {
        console.error('Error fetching letter',error);
        return c.json({
            success:false,
            message:"Failed to get letter"
        },500)
    }
}
export const getLetterBySlug = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const slug = c.req.param("slug");
    
    if (!slug)
      return c.json({ success: false, message: "Slug is required" }, 400);

    const letter = await db
      .select()
      .from(letters)
      .where(eq(letters.slug, slug))
      .limit(1);
      
    if (letter.length === 0)
      return c.json({ success: false, message: "Letter not found" }, 404);

    return c.json({ success: true, data: letter[0] });
  } catch (error) {
    console.error("Error fetching letter:", error);
    return c.json({ success: false, message: "Failed to fetch letter" }, 500);
  }
};
export const removeLetter = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const adminID = c.get("adminId")
    const body = await c.req.json();
    const {letterId} = body;
    if(!adminID){
        return c.json({
            success:false,
            message:"Unauthorized to access"
        },401)
    }
    const existingAdmin = await db.select().from(admins).where(eq(admins.id,adminID)).limit(1)
    if(!existingAdmin){
        return c.json({
            success:false,
            message:"Unauthorized access"
        },401)
    }
    if (!letterId)
      return c.json({ success: false, message: "Letter ID is required" }, 400);

    const existingLetter = await db
      .select()
      .from(letters)
      .where(eq(letters.id, letterId))
      .limit(1);
    if (existingLetter.length === 0)
      return c.json({ success: false, message: "Letter not found" }, 404);

    await db.delete(letters).where(eq(letters.id, letterId));
    return c.json({ success: true, message: "Letter deleted successfully" });
  } catch (error) {
    console.error("Error deleting Letter:", error);
    return c.json({ success: false, message: "Failed to delete Letter" }, 500);
  }
};