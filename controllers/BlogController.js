import { v2 as cloudinary } from 'cloudinary';

import BlogModel from '../models/BlogModel.js';
import StaffModel from '../models/StaffModel.js';
import slugify from 'slugify';

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

        const slug = slugify(name, {
            lower: true,
            strict: true,
            locale: 'vi',
        });

        const existingSlug = await BlogModel.findOne({ slug });
        if (existingSlug) {
            return res.status(400).json({
                success: false,
                message: 'Tên bài viết đã tồn tại',
            });
        }

        // Images
        let imageUrls = [];
        if (images && images.length > 0) {
            imageUrls = await Promise.all(
                images?.map(async (img) => {
                    const uploadedImage = await cloudinary.uploader.upload(img.path); // upload ảnh lên Cloudinary (hoặc bất kỳ dịch vụ nào khác)
                    return uploadedImage.url; // trả về URL ảnh đã tải lên
                })
            );
        }

        const newBlog = await BlogModel.create({
            name,
            slug,
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

const updateBlog = async (req, res) => {
    try {
        const blog = await BlogModel.findById(req.params.id);
        if (!blog) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy bài viết',
            });
        }

        const { name, description } = req.body;

        let slug = undefined;
        if (name) {
            slug = slugify(name, {
                lower: true,
                strict: true,
                locale: 'vi',
            });
            // Kiểm tra trùng slug nhưng loại trừ bài viết hiện tại
            // Nếu update bài viết giữ nguyên name → slug giữ nguyên, không báo lỗi.
            // Nếu đổi sang name mới mà trùng với bài viết khác → báo "Tên bài viết đã tồn tại".
            // Nếu đổi sang name mới khác → generate slug mới và update DB.
            const existingSlug = await BlogModel.findOne({
                slug,
                _id: {
                    $ne: req.params.id,
                },
            });
            if (existingSlug) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên bài viết đã tồn tại',
                });
            }
        }

        // Images
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
                })
            );
        }

        // --- Cập nhật tên và bài viết cha ---
        blog.name = name || blog.name;
        if (slug) blog.slug = slug;
        blog.description = description || null;

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

const getBlogsFromUser = async (req, res) => {
    try {
        const { excludeId } = req.query;

        const filter = excludeId ? { _id: { $ne: excludeId } } : {};

        const blogs = await BlogModel.find(filter);

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

const getBlogsFromAdmin = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await StaffModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng',
            });
        }

        let { field, value } = req.query;
        const filter = {};

        console.log('field, value: ', field, value);

        if (field && value) {
            if (typeof value === 'string') {
                value = value.trim();
            }

            if (field === 'createdAt') {
                // lọc theo ngày tạo
                const date = new Date(value);
                if (!isNaN(date)) {
                    const nextDay = new Date(date);
                    nextDay.setDate(date.getDate() + 1);
                    filter[field] = { $gte: date, $lt: nextDay };
                } else {
                    return res.status(400).json({ message: 'Giá trị ngày không hợp lệ' });
                }
            } else {
                filter[field] = { $regex: value, $options: 'i' };
            }
        }

        // phân trang
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || process.env.LIMIT_DEFAULT;
        const skip = (page - 1) * perPage;

        const [blogs, totalBlogs] = await Promise.all([
            BlogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
            BlogModel.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            blogs,
            totalPages: Math.ceil(totalBlogs / perPage),
            totalBlogs,
            page,
            perPage,
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

export {
    createBlog,
    getBlogsFromUser,
    getBlogsFromAdmin,
    getDetailsBlog,
    removeImageFromCloudinary,
    deleteBlog,
    deleteMultipleBlog,
    updateBlog,
};
