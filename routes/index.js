import userRouter from './UserRouter.js';
import categoryRouter from './CategoryRouter.js';
import productRouter from './ProductRouter.js';
import wishlistRouter from './WishlistRouter.js';

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/category', categoryRouter);
    app.use('/api/product', productRouter);
    app.use('/api/wishlist', wishlistRouter);
};

export default route;
