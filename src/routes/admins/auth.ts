import { Hono } from "hono";
import { loginAdmin,me,registerAdmin } from "../../controllers/auth/auth.controller";
import { authMiddleware } from "../../middlewares/auth";
import { logout } from "../../controllers/auth/auth.controller";
import { forgotPassword } from "../../controllers/auth/forgot-password.controller";
import { resetPassword } from "../../controllers/auth/reset,controller";

const authRouter = new Hono();


authRouter.post('/login-admin',loginAdmin)

// authRouter.post('/auth/kairos/vault/register-admin',registerAdmin)

authRouter.get('/me',authMiddleware,me)

authRouter.post('/logout',logout)


authRouter.post('/forgot-password',forgotPassword)

authRouter.post('/reset-password',resetPassword)

export default authRouter;