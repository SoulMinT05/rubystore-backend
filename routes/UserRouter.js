import { Router } from 'express';

import { register, verifyEmail } from '../controllers/UserController.js';

const userRouter = Router();

userRouter.post('/register', register);
userRouter.post('/verify-email', verifyEmail);

export default userRouter;
