import { Router } from 'express';

import { getDashboardStatistics, getMonthlyStatisticsBarChart } from '../controllers/StatisticController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const statisticRouter = Router();

statisticRouter.get('/getDashboardStatistics', verifyAccessToken, getDashboardStatistics);
statisticRouter.get('/getMonthlyStatisticsBarChart', verifyAccessToken, getMonthlyStatisticsBarChart);

export default statisticRouter;
