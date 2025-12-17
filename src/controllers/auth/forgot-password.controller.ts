 
import { Context } from "hono";
import { getDb } from "../../db/db.service";
import { admins } from "../../db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { Resend } from "resend";

export const forgotPassword = async (c: Context) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ success: false, message: "Email required" }, 400);
    }

    const db = getDb(c.env.DATABASE_URL);

    const admin = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);

 
    if (!admin.length) {
      return c.json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(admins)
      .set({
        resetTokenHash: tokenHash,
        resetTokenExpiry: expiry,
      })
      .where(eq(admins.id, admin[0].id));

    const resetLink = `${c.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    const resend = new Resend(c.env.RESEND_API_URL);

    await resend.emails.send({
      from: "Admin <no-reply@harumemoirs.xyz>",
      to: email,
      subject: "Reset dashboard password",
      html: `
        <p>Password reset requested.</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>Expires in 15 minutes.</p>
      `,
    });

    return c.json({
      success: true,
      message: "A reset link has been sent",
    });
  } catch (err) {
    console.error(err);
    return c.json(
      { success: false, message: "Internal server error" },
      500
    );
  }
};
