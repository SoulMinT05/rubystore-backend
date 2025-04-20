import userRouter from './UserRouter.js';
import categoryRouter from './CategoryRouter.js';

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/category', categoryRouter);
};

export default route;
