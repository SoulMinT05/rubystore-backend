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

        // if (!name) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Tên danh mục là bắt buộc',
        //     });
        // }

        const imageUrls = images?.map((img) => img.path); // multer-storage-cloudinary sẽ có .path là link cloud

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
export { createCategory, getCategories, getCategoriesCount, getSubCategoriesCount };
