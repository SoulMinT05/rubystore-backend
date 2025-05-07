import { Router } from 'express';

import { verifyAccessToken } from '../ middlewares/verifyToken.js';
import upload from '../ middlewares/multer.js';
import {
    createBlog,
    deleteMultipleBlog,
    deleteBlog,
    getBlogs,
    updateBlog,
    getDetailsBlog,
} from '../controllers/BlogController.js';

const blogRouter = Router();

blogRouter.delete('/deleteMultipleBlog', verifyAccessToken, deleteMultipleBlog);

blogRouter.post('/create', verifyAccessToken, upload.array('images'), createBlog);
blogRouter.get('/all-blogs', getBlogs);

blogRouter.put('/:id', verifyAccessToken, upload.array('images'), updateBlog);
blogRouter.delete('/:id', verifyAccessToken, deleteBlog);
blogRouter.get('/:id', verifyAccessToken, getDetailsBlog);

export default blogRouter;
