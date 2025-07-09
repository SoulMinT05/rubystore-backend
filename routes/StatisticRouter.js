import { Router } from 'express';

import { getDashboardStatistics } from '../controllers/StatisticController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const statisticRouter = Router();

statisticRouter.get('/getDashboardStatistics', verifyAccessToken, getDashboardStatistics);

export default statisticRouter;
