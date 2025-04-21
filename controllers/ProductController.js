import ProductModel from '../models/ProductModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            brand,
            price,
            oldPrice,
            categoryName,
            categoryId,
            subCategoryId,
            subCategory,
            thirdSubCategoryId,
            thirdSubCategory,
            countInStock,
            rating,
            isFeatured,
            isPublished,
            discount,
            productRam,
            size,
            productWeight,
        } = req.body;
        const images = req.files; // nhiều ảnh

        // if (!name || !description) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Cần nhập tên, và mô tả sản phẩm',
        //     });
        // }

        const imageUrls = Array.isArray(images) ? images.map((img) => img.path) : []; // multer-storage-cloudinary sẽ có .path là link cloud
        const product = await ProductModel.create({
            name,
            images: imageUrls,
            description,
            brand,
            price,
            oldPrice,
            categoryName,
            categoryId,
            subCategoryId,
            subCategory,
            thirdSubCategoryId,
            thirdSubCategory,
            category: categoryId,
            countInStock,
            rating,
            isFeatured,
            isPublished,
            discount,
            productRam,
            size,
            productWeight,
        });
        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Tạo sản phẩm thất bại!',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            product,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage);
        const totalProducts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find()
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsByCategoryId = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10000;
        const totalProducts = await ProductModel.countDocuments({
            categoryId: req.params.id,
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find({
            categoryId: req.params.id,
        })
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsByCategoryName = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10000;
        const totalProducts = await ProductModel.countDocuments({
            categoryName: req.query.categoryName,
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find({
            categoryName: req.query.categoryName,
        })
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsBySubCategoryId = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10000;
        const totalProducts = await ProductModel.countDocuments({
            subCategoryId: req.params.id,
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find({
            subCategoryId: req.params.id,
        })
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsBySubCategoryName = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10000;
        const totalProducts = await ProductModel.countDocuments({
            subCategoryName: req.query.subCategoryName,
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find({
            subCategoryName: req.query.subCategoryName,
        })
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsByThirdSubCategoryId = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10000;
        const totalProducts = await ProductModel.countDocuments({
            thirdSubCategoryId: req.params.id,
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find({
            thirdSubCategoryId: req.params.id,
        })
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsByThirdSubCategoryName = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10000;
        const totalProducts = await ProductModel.countDocuments({
            thirdSubCategoryName: req.query.thirdSubCategoryName,
        });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find({
            thirdSubCategoryName: req.query.thirdSubCategoryName,
        })
            .populate('category')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsByPrice = async (req, res) => {
    try {
        let productList = [];

        if (req.query.categoryId !== '' && req.query.categoryId !== undefined) {
            const productListArr = await ProductModel.find({
                categoryId: req.query.categoryId,
            }).populate('category');

            productList = productListArr;
        }

        if (req.query.subCategoryId !== '' && req.query.subCategoryId !== undefined) {
            const productListArr = await ProductModel.find({
                subCategoryId: req.query.subCategoryId,
            }).populate('category');

            productList = productListArr;
        }

        if (req.query.thirdSubCategoryId !== '' && req.query.thirdSubCategoryId !== undefined) {
            const productListArr = await ProductModel.find({
                thirdSubCategoryId: req.query.thirdSubCategoryId,
            }).populate('category');

            productList = productListArr;
        }

        const filterProducts = productList.filter((product) => {
            if (req.query.minPrice && product.price < parseInt(+req.query.minPrice)) {
                return false;
            }
            if (req.query.maxPrice && product.price > parseInt(+req.query.maxPrice)) {
                return false;
            }
            return true;
        });
        return res.status(200).json({
            success: true,
            filterProducts,
            totalPages: 0,
            page: 0,
        });
    } catch (error) {}
};

const getProductsByRating = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10000;

        const filterQuery = {
            rating: req.query.rating,
        };
        // Ưu tiên category theo thứ tự: categoryId > subCategoryId > thirdSubCategoryId
        if (req.query.categoryId) {
            filterQuery.categoryId = req.query.categoryId;
        }
        if (req.query.subCategoryId) {
            filterQuery.subCategoryId = req.query.subCategoryId;
        }
        if (req.query.thirdSubCategoryId) {
            filterQuery.thirdSubCategoryId = req.query.thirdSubCategoryId;
        }

        const totalProducts = await ProductModel.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        let products = [];
        if (req.query.categoryId !== undefined) {
            products = await ProductModel.find({
                rating: req.query.rating,
                categoryId: req.query.categoryId,
            })
                .populate('category')
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }

        if (req.query.subCategoryId !== undefined) {
            products = await ProductModel.find({
                rating: req.query.rating,
                subCategoryId: req.query.subCategoryId,
            })
                .populate('category')
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }

        if (req.query.thirdSubCategoryId !== undefined) {
            products = await ProductModel.find({
                rating: req.query.rating,
                thirdSubCategoryId: req.query.thirdSubCategoryId,
            })
                .populate('category')
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
            totalPages,
            page,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

export {
    createProduct,
    getProducts,
    getProductsByCategoryId,
    getProductsByCategoryName,
    getProductsBySubCategoryId,
    getProductsBySubCategoryName,
    getProductsByThirdSubCategoryId,
    getProductsByThirdSubCategoryName,
    getProductsByPrice,
    getProductsByRating,
};
