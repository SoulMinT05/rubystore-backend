import { Router } from 'express';

import {
    getDashboardStatistics,
    getMonthlyRevenueStatistics,
    getMonthlyStatisticsBarChart2,
    getMonthlyStatisticsBarChartProductCategoryOrderReview,
    getMonthlyStatisticsLineChartUserStaffAdmin,
    getOrderStatusStatistics,
} from '../controllers/StatisticController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';

const statisticRouter = Router();

statisticRouter.get('/getDashboardStatistics', verifyAccessToken, getDashboardStatistics);

statisticRouter.get(
    '/getMonthlyStatisticsLineChartUserStaffAdmin',
    verifyAccessToken,
    getMonthlyStatisticsLineChartUserStaffAdmin
);
statisticRouter.get('/getOrderStatusStatistics', verifyAccessToken, getOrderStatusStatistics);
statisticRouter.get('/getMonthlyRevenueStatistics', verifyAccessToken, getMonthlyRevenueStatistics);

statisticRouter.get('/getMonthlyStatisticsBarChart2', verifyAccessToken, getMonthlyStatisticsBarChart2);
statisticRouter.get(
    '/getMonthlyStatisticsBarChartProductCategoryOrderReview',
    verifyAccessToken,
    getMonthlyStatisticsBarChartProductCategoryOrderReview
);

export default statisticRouter;
