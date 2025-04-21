import userRouter from './UserRouter.js';
import categoryRouter from './CategoryRouter.js';
import productRouter from './ProductRouter.js';

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/category', categoryRouter);
    app.use('/api/product', productRouter);
};

export default route;
