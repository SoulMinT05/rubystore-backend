import userRouter from './UserRouter.js';
import categoryRouter from './CategoryRouter.js';
import productRouter from './ProductRouter.js';
import staffRouter from './StaffRouter.js';
import homeSlideRouter from './HomeSlideRouter.js';
import bannerRouter from './BannerRouter.js';

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/category', categoryRouter);
    app.use('/api/product', productRouter);
    app.use('/api/staff', staffRouter);
    app.use('/api/homeSlide', homeSlideRouter);
    app.use('/api/banner', bannerRouter);
};

export default route;
