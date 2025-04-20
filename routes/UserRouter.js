import { Router } from 'express';

import { register, verifyEmail, login, logout } from '../controllers/UserController.js';
import { verifyAccessToken, checkIsStaff, checkIsAdmin, checkAdminOrStaff } from '../ middlewares/verifyToken.js';

const userRouter = Router();

userRouter.post('/register', register);
userRouter.post('/verify-email', verifyEmail);
userRouter.post('/login', login);
userRouter.post('/logout', verifyAccessToken, logout);

export default userRouter;
