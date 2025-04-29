import CategoryModel from '../models/CategoryModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const createCategory = async (req, res) => {
    try {
        const { name, parentCategoryName, parentId } = req.body;
        const images = req.files; // nhiều ảnh

        if (!name) {
            return res.status(500).json({
                success: false,
                message: 'Cần điền tên danh mục',
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

        const newCategory = await CategoryModel.create({
            name,
            parentCategoryName: parentCategoryName || '',
            parentId: parentId || null,
            images: imageUrls,
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            newCategory,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.find();
        const categoryMap = {};

        categories.forEach((category) => {
            categoryMap[category._id] = {
                ...category._doc,
                children: [],
            };
        });
        const rootCategories = [];
        categories.forEach((category) => {
            if (category.parentId) {
                // Nếu có parentId → là danh mục con → push vào children của danh mục cha
                categoryMap[category.parentId].children.push(categoryMap[category._id]);
            } else {
                // Nếu không có parentId → là danh mục gốc (root)
                rootCategories.push(categoryMap[category._id]);
            }
        });
        return res.status(200).json({
            success: true,
            categories: rootCategories,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getCategoriesCount = async (req, res) => {
    try {
        const categoryCount = await CategoryModel.countDocuments({ parentId: undefined });
        if (!categoryCount) {
            return res.status(400).json({
                success: false,
                message: 'Không đếm được số lượng danh mục!',
            });
        } else {
            return res.status(200).json({
                success: true,
                categoryCount,
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getSubCategoriesCount = async (req, res) => {
    try {
        const categories = await CategoryModel.find();
        if (!categories) {
            return res.status(400).json({
                success: false,
                message: 'Không có danh mục con',
            });
        } else {
            const subCatArr = [];
            for (let cat of categories) {
                if (cat.parentId !== undefined) {
                    subCatArr.push(cat);
                }
            }
            return res.status(200).json({
                success: true,
                subCategories: subCatArr.length,
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getDetailsCategory = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy danh mục với id này',
            });
        }
        return res.status(200).json({
            success: true,
            category,
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

const deleteCategory = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);
        const images = category.images;

        if (images.length > 0) {
            for (let img of images) {
                const imgUrl = img;
                const urlArr = imgUrl.split('/');
                const image = urlArr[urlArr.length - 1];
                const imageName = image.split('.')[0];

                if (imageName) {
                    await cloudinary.uploader.destroy(imageName);
                }
            }
        }
        const subCategory = await CategoryModel.find({
            parentId: req.params.id,
        });
        for (let i = 0; i < subCategory.length; i++) {
            const thirdSubCategory = await CategoryModel.find({
                parentId: subCategory[i]._id,
            });
            for (let i = 0; j < thirdSubCategory.length; i++) {
                await CategoryModel.findByIdAndDelete(thirdSubCategory[i]._id);
            }
            await CategoryModel.findByIdAndDelete(subCategory[i]._id);
        }

        const deletedCat = await CategoryModel.findByIdAndDelete(req.params.id);
        if (!deletedCat) {
            return res.status(400).json({
                success: false,
                message: 'Danh mục không tồn tại',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Xoá danh mục thành công',
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy danh mục',
            });
        }

        const deletedImages = req.body.deletedImages || []; // array các URL cần xoá

        if (deletedImages.length > 0) {
            category.images = category.images.filter((img) => !deletedImages.includes(img));
        }

        // --- Thêm ảnh mới nếu có ---
        const newImages = req.files?.map((file) => file.path) || [];

        if (newImages.length > 0) {
            // Sử dụng Promise.all để xử lý nhiều ảnh cùng một lúc
            await Promise.all(
                newImages.map((image) => {
                    return category.images.push(image); // Đẩy ảnh vào mảng images
                }),
            );
        }

        // --- Cập nhật tên và danh mục cha ---
        category.name = req.body.name || category.name;
        category.parentId = req.body.parentId || null;
        category.parentCategoryName = req.body.parentCategoryName || '';

        await category.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            updatedCategory: category,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

export {
    createCategory,
    getCategories,
    getCategoriesCount,
    getSubCategoriesCount,
    getDetailsCategory,
    removeImageFromCloudinary,
    deleteCategory,
    updateCategory,
};
