import BlogModel from '../models/BlogModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const createBlog = async (req, res) => {
    try {
        const { name, description } = req.body;
        const images = req.files; // nhiều ảnh

        if (!name) {
            return res.status(500).json({
                success: false,
                message: 'Cần điền tên bài viết',
            });
        }

        let imageUrls = [];
        if (images && images.length > 0) {
            imageUrls = await Promise.all(
                images?.map(async (img) => {
                    const uploadedImage = await cloudinary.uploader.upload(img.path); // upload ảnh lên Cloudinary (hoặc bất kỳ dịch vụ nào khác)
                    return uploadedImage.url; // trả về URL ảnh đã tải lên
                }),
            );
        }

        const newBlog = await BlogModel.create({
            name,
            description: description || '',
            images: imageUrls,
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo bài viết thành công',
            newBlog,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getBlogs = async (req, res) => {
    try {
        const blogs = await BlogModel.find();

        return res.status(200).json({
            success: true,
            blogs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getDetailsBlog = async (req, res) => {
    try {
        const blog = await BlogModel.findById(req.params.id);
        if (!blog) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy bài viết với id này',
            });
        }
        return res.status(200).json({
            success: true,
            blog,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const removeImageFromCloudinary = async (req, res) => {
    try {
        const imgUrl = req.query.img;
        const urlArr = imgUrl.split('/');
        const image = urlArr[urlArr.length - 1];
        const imageName = image.split('.')[0];

        if (imageName) {
            const result = await cloudinary.uploader.destroy(imageName);
            if (result) {
                return res.status(200).json({
                    success: true,
                    message: 'Xoá ảnh thành công',
                });
            }
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBlog = await BlogModel.findByIdAndDelete(id);

        if (!deletedBlog) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để xoá' });
        }
        if (deletedBlog.image) {
            const urlArr = deletedBlog.image.split('/');
            const publicIdWithExt = urlArr[urlArr.length - 1];
            const publicId = publicIdWithExt.split('.')[0];
            await cloudinary.uploader.destroy(`rubystore/${publicId}`);
        }

        res.status(200).json({ success: true, message: 'Xoá bài viết thành công' });
    } catch (error) {
        console.error('Lỗi xoá bài viết:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMultipleBlog = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp id blog',
            });
        }
        const blogs = await BlogModel.find({ _id: { $in: ids } });
        const destroyImagePromises = blogs.flatMap((product) => {
            const images = product.images || [];
            return images.map((img) => {
                const urlArr = img.split('/');
                const image = urlArr[urlArr.length - 1];
                const imageName = image.split('.')[0];
                return cloudinary.uploader.destroy(imageName);
            });
        });

        await Promise.all(destroyImagePromises);

        await BlogModel.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: 'Xoá bài viết thành công',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

const updateBlog = async (req, res) => {
    try {
        const blog = await BlogModel.findById(req.params.id);
        if (!blog) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy bài viết',
            });
        }

        const deletedImages = req.body.deletedImages || []; // array các URL cần xoá

        if (deletedImages.length > 0) {
            blog.images = blog.images.filter((img) => !deletedImages.includes(img));
        }

        // --- Thêm ảnh mới nếu có ---
        const newImages = req.files?.map((file) => file.path) || [];

        if (newImages.length > 0) {
            // Sử dụng Promise.all để xử lý nhiều ảnh cùng một lúc
            await Promise.all(
                newImages.map((image) => {
                    return blog.images.push(image); // Đẩy ảnh vào mảng images
                }),
            );
        }

        // --- Cập nhật tên và bài viết cha ---
        blog.name = req.body.name || blog.name;
        blog.description = req.body.description || null;

        await blog.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật bài viết thành công',
            updatedBlog: blog,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

export { createBlog, getBlogs, getDetailsBlog, removeImageFromCloudinary, deleteBlog, deleteMultipleBlog, updateBlog };
