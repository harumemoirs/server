import * as dotenv from "dotenv";
import { Context } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { getDb } from "../../db/db.service";
import { admins } from "../../db/schema";
import { eq } from "drizzle-orm";
import { createToken, hashPassword, verifyPassword } from "../../tokens/token";

dotenv.config();

const getCookieOptions = (c: Context) => {
  const origin = c.req.header("origin") || "";
  const host = c.req.header("host") || "";
  let domain: string | undefined = undefined;

  if (origin.includes("harumemoirs.in") || host.includes("harumemoirs.in")) {
    domain = ".harumemoirs.in";
  } else if (origin.includes("harumemoirs.xyz") || host.includes("harumemoirs.xyz")) {
    domain = ".harumemoirs.xyz";
  }

  return {
    httpOnly: true,
    secure: true,
    sameSite: "None" as const,
    domain,
    maxAge: 5 * 24 * 60 * 60,
    path: "/",
  };
};

interface AdminData {
  email: string;
  password: string;
  name: string;
  baseCode: string;
}

export const loginAdmin = async (c: Context) => {
  try {
    const body = await c.req.json<AdminData>();
    const { email, password } = body;
    if (!email || !password) {
      return c.json({
        success: false,
        message: "",
      });
    }
    const db = getDb(c.env.DATABASE_URL);
    if (!db) {
      return c.json({
        success: false,
        message: "Invalid datbase config",
      });
    }
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);
    if (existingAdmin.length === 0) {
      return c.json({
        success: false,
        message: "Admin with that email does not exist",
      });
    }
    const adminAuthData = existingAdmin[0];
    const validatePassword = await verifyPassword(
      password,
      adminAuthData.password
    );
    if (!validatePassword) {
      return c.json(
        {
          success: false,
          message: "Incorrect password entered",
        },
        401
      );
    }
    const token = await createToken(adminAuthData.id, c.env.JWT_SECRET);
    setCookie(c, "an_token", token, getCookieOptions(c));
    return c.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        email: adminAuthData.email,
        name: adminAuthData.name,
        id: adminAuthData.id
      },
    });
  } catch (error) {
    console.log(error);
    return c.json(
      {
        success: false,
        message: "Unable to login admin, internal server error",
      },
      500
    );
  }
};

export const registerAdmin = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const safeCode = c.env.BASE_CODE;
    const body = await c.req.json<AdminData>();
    const { email, password, name, baseCode } = body;
    if (!email || !password || !name || !baseCode) {
      return c.json(
        {
          success: false,
          message: "Could not register admin, required fields missing",
        },
        400
      );
    }
    if (baseCode != safeCode) {
      return c.json(
        {
          success: false,
          message: "Failed to authenticate",
        },
        401
      );
    }
    if (password.length < 8) {
      return c.json(
        {
          success: false,
          message: "Password too short, it must be minmum 8 characters long",
        },
        400
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(
        {
          success: false,
          message: "Invalid email format",
        },
        400
      );
    }
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email));
    if (existingAdmin.length > 0) {
      return c.json(
        {
          success: false,
          message: "Admnin with this email already exists",
        },
        409
      );
    }
    const hashedPassword = await hashPassword(password);
    const newAdmin = await db
      .insert(admins)
      .values({
        email,
        name,
        password: hashedPassword,
      })
      .returning({
        id: admins.id,
        email: admins.email,
        name: admins.name,
      });
    const adminRegistrationData = newAdmin[0];
    const token = await createToken(adminRegistrationData.id, c.env.JWT_SECRET);
    setCookie(c, "an_token", token, getCookieOptions(c));
    return c.json({
      success: true,
      message: "Admin registration successful",
      token,
      admins: {
        email: adminRegistrationData.email,
        name: adminRegistrationData.name,
      },
    });
  } catch (error) {
    console.log(error);
    return c.json(
      {
        success: false,
        message: "Could not register admin, internal server error",
      },
      500
    );
  }
};
//to check admin
export const me = async (c: Context) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const adminId = c.get("adminId");
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1);
    if (!admin) {
      return c.json({
        success: false,
        message: "Admin not found",
      });
    }
    return c.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.log(error);
    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500
    );
  }
};

export const logout = async (c: Context) => {
  try {
    const opts = getCookieOptions(c);
    setCookie(c, "an_token", "", {
      ...opts,
      maxAge: 0,
      expires: new Date(0),
    });

    return c.json({ success: true, message: "Logged out" });
  } catch (error) {
    return c.json({
      succes: false,
      message: "Could not log out, internal server error",
    });
  }
};
