import { Context } from "hono";
import { admins, subscribers } from "../../db/schema";
import { getDb } from "../../db/db.service";
import { desc, eq, sql } from "drizzle-orm";
import { success, z } from "zod";
import { Resend } from "resend";
const emailSchema = z.string().email();
 
export const subscribe = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const resend = new Resend(c.env.RESEND_API_URL);
    const body = await c.req.json();
    const email = body.email;
   
    console.log(email)
    
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      return c.json(
        {
          success: false,
          message: "Invalid email provided",
        },
        400
      );
    }
    if (!db) {
      return c.json(
        {
          success: false,
          message: "DB initialization failed",
          issue: "Severe, contact provider",
        },
        500
      );
    }
    if (!resend) {
   
      return c.json(

        {
          success: false,
          message: "Email provider failed",
        },
        500
      );
    }
    const existingSubscriber = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);
    if (existingSubscriber.length > 0) {
      return c.json(
        {
          success: false,
          message: "You have already subscribed to the newsletter!",
        },
        409
      );
    }

    const [subscriber] = await db
      .insert(subscribers)
      .values({ email })
      .returning();

    console.log('email-payload:',email)
    const mail = await resend.emails.send({
      from: "Welcome <newsletter@harumemoirs.xyz>",
      to: email ,
      subject: "You're subscribed! 🎉",
      html: `<h2>Welcome to our Newsletter!</h2>
           <p>Excited to have you onboard 🚀</p>`,
    });
    console.log(mail)
    if (!mail.data?.id) {
      
      await db.delete(subscribers).where(eq(subscribers.id, subscriber.id));
      return c.json({
        success:false,
        message:"Failed to send letter"
        
      },500)
    }

    
    await db
      .update(subscribers)
      .set({ isVerified: true })
      .where(eq(subscribers.id, subscriber.id));

    return c.json({ message: "Subscription successful" }, 200);
  } catch (error) {
    console.log(error)
    return c.json({
        success:false,
        message:"Could not subscribe to newsletter, Internal server error"
    },500)
  }
};


export const getAllSubscribers = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const page = Number(c.req.query("page")??1);
    const limit = Number(c.req.query("limit")??20);
    const offset = (page-1)*limit;
    const [{count}] = await db.select({
      count:sql<number>`count(*)`
    }).from(subscribers)
    const subscriberList = await db.select().from(subscribers).orderBy(desc(subscribers.joinedAt)).limit(limit).offset(offset)
    return c.json({
      success:true,
      data:subscriberList,
      pagination:{
        total:count,
        page,
        limit,
        totalPages:Math.ceil(count/limit),
        hasNextPage:page*limit<count,
        hasPrevPage:page>1
      }
    })
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return c.json(  
      {
        success: false,
        message:"Failed to fetch subscribers",
      },
      500
    );
  }
};

export const removeSubscriber = async (c:Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL)
    const adminId = c.get('adminId')
    if(!adminId){
      return c.json({
        success:false,
        message:"Unauthorized"
      },401)
    }
    const body = await c.req.json();
    const {id} = body;
    if(!id){
      return c.json({
        success:false,
        message:"Bad request"
      },400)
    }
    const verifyAdmin = await db.select().from(admins).where(eq(admins.id,adminId)).limit(1)
    if(verifyAdmin.length === 0){
      return c.json({
        success:false,
        message:"Admin not found"
      },404)
    }
    const existingSubscriber = await db.select().from(subscribers).where(eq(subscribers.id,id)).limit(1)
    if(existingSubscriber.length === 0){
      return c.json({
        success:false,
        message:"Subscriber not found"
      },404)
    }
    await db.delete(subscribers).where(eq(subscribers.id,id));
    return c.json({
      success:true,
      message:"Subscriber deleted successfully"
    })

  } catch (error) {
    console.error("Error removing subscriber:", error);
    return c.json({ success: false, message: "Failed to remove subscriber" })
  }
}


export const unsubscribe = async (c: Context) => {
  try {
    const email = c.req.query("email");

    if (!email) {
      return c.json(
        { success: false, message: "Email is required" },
        400
      );
    }

    const db = getDb(c.env.DATABASE_URL);

    const existing = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);

    if (!existing.length) {
      return c.json(
        { success: false, message: "Subscriber not found" },
        404
      );
    }

    if (!existing[0].isSubscribed) {
      return c.json({
        success: true,
        message: "You are already unsubscribed",
      });
    }

    await db
      .update(subscribers)
      .set({
        isSubscribed: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(subscribers.email, email));

    return c.json({
      success: true,
      message: "You have been unsubscribed successfully",
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return c.json(
      { success: false, message: "Internal server error" },
      500
    );
  }
};