// src/controllers/auth/resetPassword.controller.ts
import { Context } from "hono";
import { getDb } from "../../db/db.service";
import { admins } from "../../db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
 
import { hashPassword } from "../../tokens/token";

export const resetPassword = async (c: Context) => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json({ success: false, message: "Invalid request" }, 400);
    }

    if (newPassword.length < 8) {
      return c.json(
        { success: false, message: "Password must be at least 8 characters" },
        400
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const db = getDb(c.env.DATABASE_URL);

    const admin = await db
      .select()
      .from(admins)
      .where(
        and(
          eq(admins.resetTokenHash, tokenHash),
          gt(admins.resetTokenExpiry, new Date())
        )
      )
      .limit(1);

    if (!admin.length) {
      return c.json(
        { success: false, message: "Token invalid or expired" },
        400
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(admins)
      .set({
        password: hashedPassword,
        resetTokenHash: null,
        resetTokenExpiry: null,
      })
      .where(eq(admins.id, admin[0].id));

    return c.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error(err);
    return c.json(
      { success: false, message: "Internal server error" },
      500
    );
  }
};
