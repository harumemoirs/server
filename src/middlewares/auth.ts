import { Context } from "hono";
import { verifyToken } from "../tokens/token";
import * as dotenv from "dotenv"
import { getCookie } from "hono/cookie";

dotenv.config()

type AdminJwtPayload = {
    id:string;
    iat?:number;
    exp?:number;  
}
export const authMiddleware = async (c: Context, next: Function) => {
  const token = getCookie(c, "an_token");

  if (!token) {
    return c.json(
      {
        success: false,
        message: "Authentication cookie not found",
      },
      401
    );
  }

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET) as AdminJwtPayload;

    c.set("adminId", payload.id);

    await next();
  } catch (error: any) {
   
    if (error.name === "TokenExpiredError" || error.message?.includes("expired")) {
      return c.json(
        {
          success: false,
          message: "Session expired. Please log in again.",
        },
        401
      );
    }

     
    return c.json(
      {
        success: false,
        message: "Invalid authentication token.",
      },
      401
    );
  }
};
