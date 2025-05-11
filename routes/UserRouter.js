import { Router } from 'express';

import {
    register,
    verifyEmail,
    login,
    logout,
    uploadAvatar,
    removeImageFromCloudinary,
    updateInfoUser,
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    refreshToken,
    getUserDetails,
    // CART
    addToCart,
    decreaseQuantityCart,
    removeProductCart,
    getCart,
    // WISHLIST
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    checkLogin,
    checkIsRefreshToken,
    changePassword,
    updateAddress,
    authWithGoogle,
    authWithFacebook,
    getDetailsReview,
    addReview,
    getReviews,
} from '../controllers/UserController.js';
import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';

const userRouter = Router();

userRouter.post('/register', register);
userRouter.post('/verify-email', verifyEmail);
userRouter.post('/login', login);
userRouter.post('/auth-google', authWithGoogle);
userRouter.post('/auth-facebook', authWithFacebook);
userRouter.post('/logout', verifyAccessToken, logout);
userRouter.put('/avatar', verifyAccessToken, upload.single('avatar'), uploadAvatar);
userRouter.delete('/delete-image', verifyAccessToken, removeImageFromCloudinary);
userRouter.put('/update-info', verifyAccessToken, updateInfoUser);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/verify-forgot-password', verifyForgotPasswordOtp);
userRouter.post('/reset-password', resetPassword);
userRouter.post('/change-password', verifyAccessToken, changePassword);
userRouter.get('/refreshToken', refreshToken);
userRouter.get('/user-details', verifyAccessToken, getUserDetails);
userRouter.get('/check-login', checkLogin);
userRouter.get('/checkIsRefreshToken', checkIsRefreshToken);

// CART
userRouter.post('/addToCart', verifyAccessToken, addToCart);
userRouter.post('/decreaseQuantityCart', verifyAccessToken, decreaseQuantityCart);
userRouter.post('/removeProductCart', verifyAccessToken, removeProductCart);
userRouter.get('/cart', verifyAccessToken, getCart);

// WISHLIST
userRouter.post('/addToWishlist', verifyAccessToken, addToWishlist);
userRouter.delete('/removeFromWishlist/:productId', verifyAccessToken, removeFromWishlist);
userRouter.get('/getWishlist', verifyAccessToken, getWishlist);

// ADDRESS
userRouter.put('/update-address', verifyAccessToken, updateAddress);

// REVIEW
userRouter.post('/addReview', verifyAccessToken, addReview);
userRouter.get('/all-reviews', getReviews);
userRouter.get('/reviews/:productId', getDetailsReview);
export default userRouter;
