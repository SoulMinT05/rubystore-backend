import userRouter from './UserRouter.js';
import categoryRouter from './CategoryRouter.js';
import productRouter from './ProductRouter.js';
import staffRouter from './StaffRouter.js';

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/category', categoryRouter);
    app.use('/api/product', productRouter);
    app.use('/api/staff', staffRouter);
};

export default route;
