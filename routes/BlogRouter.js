import { Router } from 'express';

import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';
import {
    createBlog,
    deleteMultipleBlog,
    deleteBlog,
    getBlogsFromUser,
    updateBlog,
    getDetailsBlog,
    getBlogsFromAdmin,
    getDetailsBlogBySlug,
} from '../controllers/BlogController.js';

const blogRouter = Router();

blogRouter.delete('/deleteMultipleBlog', verifyAccessToken, deleteMultipleBlog);

blogRouter.post('/create', verifyAccessToken, upload.array('images'), createBlog);
blogRouter.get('/all-blogs', getBlogsFromUser);
blogRouter.get('/all-blogs-admin', [verifyAccessToken], getBlogsFromAdmin);

blogRouter.get('/getDetailsBlogBySlug/:slug', verifyAccessToken, getDetailsBlogBySlug);
blogRouter.get('/:id', verifyAccessToken, getDetailsBlog);
blogRouter.put('/:id', verifyAccessToken, upload.array('images'), updateBlog);
blogRouter.delete('/:id', verifyAccessToken, deleteBlog);

export default blogRouter;
