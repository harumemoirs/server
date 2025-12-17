import { Context } from "hono";
import { getDb } from "../../db/db.service";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { subscribers, newsletters, admins } from "../../db/schema";
import { Resend } from "resend";
import { uploadToCloudinary } from "../../config/cloudinary.helper";

 

const newsletterSchema = z.object({
  title: z.string().min(3),
  subject: z.string().min(3),
  body: z.string().min(10),
});
 

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
};

const buildHtml = (
  subject: string,
  body: string,
  imageUrl?: string,
  email?: string,
  baseUrl?: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F0EBE7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    
    <!-- Banner Section -->
    <div style="background-color:#ffffff;border-radius:12px 12px 0 0;padding:32px;text-align:center;border-bottom:1px solid #e5e5e5">
      <h1 style="margin:0;font-size:28px;color:#2F4858;font-weight:600;letter-spacing:-0.5px">${subject}</h1>
      <p style="margin:8px 0 0 0;font-size:14px;color:#666;font-style:italic">A quiet note from Haxu Memori</p>
    </div>

    <!-- Main Content Section -->
    <div style="background-color:#ffffff;padding:32px">
      ${
        imageUrl
          ? `<div style="margin:0 0 24px 0">
              <img src="${imageUrl}" alt="Newsletter image" style="max-width:100%;height:auto;border-radius:8px;display:block" />
            </div>`
          : ""
      }

      <div style="font-size:16px;line-height:1.7;color:#333;text-align:left">
        ${body.replace(/\n\n/g, "</p><p style='margin:16px 0'>").replace(/\n/g, "<br/>")}
      </div>
    </div>

    <!-- Footer Section -->
    <div style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:32px;text-align:center;border-top:1px solid #e5e5e5">
      <div style="margin-bottom:20px">
        <img src="https://res.cloudinary.com/dwtbvdlzg/image/upload/v1764268052/footer-1st-option_ieu0oz.jpg" alt="Footer" style="max-width:200px;height:auto;opacity:0.8" />
      </div>
      
      <p style="margin:0 0 16px 0;font-size:13px;color:#666;line-height:1.6">
        You received this email because you subscribed to our newsletter.
        <br/>
        We respect your inbox and your time.
      </p>

      <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(email || '')}" 
         style="display:inline-block;background-color:#2F4858;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:500;margin-top:8px;transition:background-color 0.2s">
        Unsubscribe
      </a>

      <p style="margin:20px 0 0 0;font-size:11px;color:#999">
        © ${new Date().getFullYear()} Haxu Memori. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
`;
 
const sendNewsletter = async (
  c: Context,
  subs: { email: string }[],
  data: z.infer<typeof newsletterSchema>,
  imageUrl?: string
) => {
  const resend = new Resend(c.env.RESEND_API_URL);

  // Send 2 emails per batch to respect rate limit
  const batches = chunk(subs, 2);
  let delivered = 0;
  let failed = 0;

  console.log(`Sending to ${subs.length} subscribers in ${batches.length} batches`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} emails)`);

    const results = await Promise.allSettled(
      batch.map(async (sub) => {
        const res = await resend.emails.send({
          from: "Newsletter <newsletter@harumemoirs.xyz>",
          to: sub.email,
          subject: data.subject,
          html: buildHtml(
            data.subject,
            data.body,
            imageUrl,
            sub.email,
            c.env.BASE_URL
          ),
        });

        if (!res.data?.id) {
          const errorMsg = res.error 
            ? `Resend error: ${JSON.stringify(res.error)}` 
            : `No ID returned`;
          throw new Error(errorMsg);
        }
        return true;
      })
    );

    // Count successes and failures
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        delivered++;
        console.log(`✓ Sent to ${batch[idx].email}`);
      } else {
        failed++;
        console.error(`✗ Failed for ${batch[idx].email}:`, result.reason.message);
      }
    });

    // Wait 1 second between batches to respect rate limit (2 per second)
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`Newsletter send complete: ${delivered} delivered, ${failed} failed`);
  return { delivered, failed };
};

/* ================= CONTROLLER ================= */

export const broadcastNewsletter = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const adminId = c.get("adminId");

    if (!adminId) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const verifyAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);

    if (verifyAdmin.length === 0) {
      return c.json({ success: false, message: "Admin not found" }, 404);
    }

    /* -------- Parse multipart body -------- */
    const body = await c.req.parseBody();

    const parsed = newsletterSchema.safeParse({
      title: body.title,
      subject: body.subject,
      body: body.body,
    });

    if (!parsed.success) {
      return c.json({ success: false, message: "Invalid payload" }, 400);
    }

    /* -------- Handle image upload -------- */
    const image = body.image as File | undefined;
    let imageUrl: string | undefined;

    if (image instanceof File) {
      if (!c.env.CLOUDINARY_NAME || !c.env.CLOUDINARY_API_KEY) {
        return c.json(
          { success: false, message: "Cloudinary config missing" },
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

      const uploadedUrl = await uploadToCloudinary(image, {
        cloudName: c.env.CLOUDINARY_NAME,
        apiKey: c.env.CLOUDINARY_API_KEY,
        uploadPreset: c.env.CLOUDINARY_PRESET,
        folder: "newsletters",
        sign: useSignedUpload,
        apiSecret: c.env.CLOUDINARY_SECRET_KEY,
      });

      imageUrl = uploadedUrl;
    }

    /* -------- Fetch subscribers -------- */
    const subs = await db
      .select({ email: subscribers.email })
      .from(subscribers)
      .where(eq(subscribers.isVerified, true));

    if (subs.length === 0) {
      return c.json({
        success: true,
        message: "No verified subscribers",
      });
    }

    console.log(`Broadcasting newsletter to ${subs.length} subscribers`);

    /* -------- Background execution -------- */
    c.executionCtx.waitUntil(
      (async () => {
        try {
          console.log("Starting background newsletter send...");
          
          const { delivered, failed } = await sendNewsletter(
            c,
            subs,
            parsed.data,
            imageUrl
          );

          console.log(`Attempting to save newsletter record: delivered=${delivered}, failed=${failed}`);

          // Get a fresh DB connection for the background task
          const bgDb = getDb(c.env.DATABASE_URL);
          
          const result = await bgDb.insert(newsletters).values({
            adminId,
            title: parsed.data.title,
            subject: parsed.data.subject,
            content: parsed.data.body,
            sentTo: String(delivered),
            failedFor: String(failed),
          });

          console.log("Newsletter record saved successfully:", result);
        } catch (error) {
          console.error("Background newsletter send failed:", error);
          console.error("Error details:", error instanceof Error ? error.stack : error);
        }
      })()
    );
    
    return c.json({
      success: true,
      queued: subs.length,
      message: `Newsletter queued for ${subs.length} subscribers`,
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return c.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to broadcast newsletter",
      },
      500
    );
  }
};