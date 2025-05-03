import ProductModel from '../models/ProductModel.js';
import ProductRamModel from '../models/ProductRamModel.js';
import ProductWeightModel from '../models/ProductWeightModel.js';

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
            subCategoryName,
            thirdSubCategoryId,
            thirdSubCategoryName,
            countInStock,
            rating,
            isFeatured,
            isPublished,
            discount,
            productRam,
            productSize,
            productWeight,
        } = req.body;
        const images = req.files; // nhiều ảnh

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Cần nhập tên, và mô tả sản phẩm',
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
        const newProduct = await ProductModel.create({
            name,
            images: imageUrls,
            description,
            brand,
            price,
            oldPrice,
            categoryName,
            categoryId,
            subCategoryId,
            subCategoryName,
            thirdSubCategoryId,
            thirdSubCategoryName,
            category: categoryId,
            countInStock,
            rating,
            isFeatured,
            isPublished,
            discount,
            productRam,
            productSize,
            productWeight,
        });
        if (!newProduct) {
            return res.status(400).json({
                success: false,
                message: 'Tạo sản phẩm thất bại!',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công',
            newProduct,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const createProductRam = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Cần nhập RAM sản phẩm',
            });
        }

        const existingProductRam = await ProductRamModel.findOne({ name });
        if (existingProductRam) {
            return res.status(400).json({
                success: false,
                message: 'Tên RAM sản phẩm đã tồn tại!',
            });
        }

        const newProductRam = await ProductRamModel.create({
            name,
        });
        if (!newProductRam) {
            return res.status(400).json({
                success: false,
                message: 'Tạo RAM sản phẩm thất bại!',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Tạo RAM sản phẩm thành công',
            newProductRam,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const createProductWeight = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Cần nhập cân nặng sản phẩm',
            });
        }

        const existingProductWeight = await ProductWeightModel.findOne({ name });
        if (existingProductWeight) {
            return res.status(400).json({
                success: false,
                message: 'Cân nặng này đã tồn tại!',
            });
        }

        const newProductWeight = await ProductWeightModel.create({
            name,
        });
        if (!newProductWeight) {
            return res.status(400).json({
                success: false,
                message: 'Tạo RAM sản phẩm thất bại!',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Tạo RAM sản phẩm thành công',
            newProductWeight,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsAdmin = async (req, res) => {
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

const getProductsUser = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage);
        const totalProducts = await ProductModel.countDocuments({ isPublished: true });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        const products = await ProductModel.find({ isPublished: true })
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

const getProductsRam = async (req, res) => {
    try {
        const productsRam = await ProductRamModel.find();
        if (!productsRam) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy RAM sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            productsRam,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsWeight = async (req, res) => {
    try {
        const productsWeight = await ProductWeightModel.find();
        if (!productsWeight) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy RAM sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            productsWeight,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
            isPublished: true,
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
                isPublished: true,
                categoryId: req.query.categoryId,
            }).populate('category');

            productList = productListArr;
        }

        if (req.query.subCategoryId !== '' && req.query.subCategoryId !== undefined) {
            const productListArr = await ProductModel.find({
                isPublished: true,
                subCategoryId: req.query.subCategoryId,
            }).populate('category');

            productList = productListArr;
        }

        if (req.query.thirdSubCategoryId !== '' && req.query.thirdSubCategoryId !== undefined) {
            const productListArr = await ProductModel.find({
                isPublished: true,
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
            isPublished: true,
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
                isPublished: true,
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
                isPublished: true,
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
                isPublished: true,
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

const getProductsCount = async (req, res) => {
    try {
        const productsCount = await ProductModel.countDocuments({
            isPublished: true,
        });
        if (!productsCount) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            productsCount,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getProductsByFeature = async (req, res) => {
    try {
        const products = await ProductModel.find({
            isFeatured: true,
        }).populate('category');

        if (!products) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }
        const images = product.images;
        for (const img of images) {
            const imgUrl = img;
            const urlArr = imgUrl.split('/');
            const image = urlArr[urlArr.length - 1];
            const imageName = image.split('.')[0];

            if (imageName) {
                await cloudinary.uploader.destroy(imageName);
            }
        }

        const deletedProduct = await ProductModel.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm để xoá',
            });
        }
        return res.status(200).json({
            success: true,
            deletedProduct,
            message: 'Xoá sản phẩm thành công',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const deleteMultipleProduct = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp id sản phẩm',
            });
        }

        const products = await ProductModel.find({ _id: { $in: ids } });
        const destroyImagePromises = products.flatMap((product) => {
            const images = product.images || [];
            return images.map((img) => {
                const urlArr = img.split('/');
                const image = urlArr[urlArr.length - 1];
                const imageName = image.split('.')[0];
                return cloudinary.uploader.destroy(imageName);
            });
        });

        await Promise.all(destroyImagePromises);

        // Xoá tất cả sản phẩm
        await ProductModel.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: 'Xoá sản phẩm thành công',
        });

        // for (let i = 0; i < ids.length; i++) {
        //     const product = await ProductModel.findById(ids[i]);

        //     const images = product.images;
        //     for (const img of images) {
        //         const imgUrl = img;
        //         const urlArr = imgUrl.split('/');
        //         const image = urlArr[urlArr.length - 1];
        //         const imageName = image.split('.')[0];

        //         if (imageName) {
        //             await cloudinary.uploader.destroy(imageName);
        //         }
        //     }

        //     await ProductModel.deleteMany({
        //         _id: {$in: ids,},
        //     });
        // }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

const deleteProductRam = async (req, res) => {
    try {
        const productRam = await ProductRamModel.findByIdAndDelete(req.params.id);
        if (!productRam) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        return res.status(200).json({
            success: true,
            deletedProductRam: productRam,
            message: 'Xoá RAM sản phẩm thành công',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const deleteMultipleProductRam = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp id RAM sản phẩm',
            });
        }

        const productsRam = await ProductRamModel.find({ _id: { $in: ids } });

        // Xoá tất cả sản phẩm
        await ProductRamModel.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: 'Xoá RAM sản phẩm thành công',
            productsRam,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

const deleteProductWeight = async (req, res) => {
    try {
        const productWeight = await ProductWeightModel.findByIdAndDelete(req.params.id);
        if (!productWeight) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        return res.status(200).json({
            success: true,
            deletedProductWeight: productWeight,
            message: 'Xoá cân nặng sản phẩm thành công',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const deleteMultipleProductWeight = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp id cân nặng sản phẩm',
            });
        }

        const productsWeight = await ProductWeightModel.find({ _id: { $in: ids } });

        // Xoá tất cả sản phẩm
        await ProductWeightModel.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: 'Xoá cân nặng sản phẩm thành công',
            productsWeight,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

const getDetailsProduct = async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy sản phẩm với id này',
            });
        }
        return res.status(200).json({
            success: true,
            product,
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

const updateProduct = async (req, res) => {
    try {
        const product = await ProductModel.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                brand: req.body.brand,
                price: req.body.price,
                oldPrice: req.body.oldPrice,
                categoryName: req.body.categoryName,
                categoryId: req.body.categoryId,
                category: req.body.category,
                subCategoryId: req.body.subCategoryId,
                subCategoryName: req.body.subCategoryName,
                thirdSubCategoryId: req.body.thirdSubCategoryId,
                thirdSubCategoryName: req.body.thirdSubCategoryName,
                countInStock: req.body.countInStock,
                rating: req.body.rating,
                isFeatured: req.body.isFeatured,
                isPublished: req.body.isPublished,
                discount: req.body.discount,
                productRam: req.body.productRam,
                productSize: req.body.productSize,
                productWeight: req.body.productWeight,
            },
            { new: true },
        );

        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        // --- Xoá ảnh cũ nếu có deletedImages ---
        const deletedImages = req.body.deletedImages || []; // array các URL cần xoá

        if (deletedImages.length > 0) {
            product.images = product.images.filter((img) => !deletedImages.includes(img));

            //     // Xoá ảnh khỏi cloudinary
            //     for (const url of deletedImages) {
            //         const urlArr = url.split('/');
            //         const imageWithExt = urlArr[urlArr.length - 1];
            //         const publicId = imageWithExt.split('.')[0];

            //         if (publicId) {
            //             await cloudinary.uploader.destroy(publicId);
            //         }
            //     }
        }
        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map(async (img) => {
                    const uploadedImage = await cloudinary.uploader.upload(img.path);
                    return uploadedImage.url;
                }),
            );
        }
        product.images = [...product.images, ...imageUrls];

        await product.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            updatedProduct: product,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const updateProductRam = async (req, res) => {
    try {
        const productRam = await ProductRamModel.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
            },
            { new: true },
        );

        if (!productRam) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        await productRam.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật RAM sản phẩm thành công',
            updatedProductRam: productRam,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const updateProductWeight = async (req, res) => {
    try {
        const productWeight = await ProductWeightModel.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
            },
            { new: true },
        );

        if (!productWeight) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        await productWeight.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật RAM sản phẩm thành công',
            updatedProductWeight: productWeight,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

export {
    createProduct,
    createProductRam,
    createProductWeight,
    getProductsAdmin,
    getProductsUser,
    getProductsRam,
    getProductsWeight,
    getProductsByCategoryId,
    getProductsByCategoryName,
    getProductsBySubCategoryId,
    getProductsBySubCategoryName,
    getProductsByThirdSubCategoryId,
    getProductsByThirdSubCategoryName,
    getProductsByPrice,
    getProductsByRating,
    getProductsCount,
    getProductsByFeature,
    deleteProduct,
    deleteMultipleProduct,
    deleteProductRam,
    deleteMultipleProductRam,
    deleteProductWeight,
    deleteMultipleProductWeight,
    getDetailsProduct,
    removeImageFromCloudinary,
    updateProduct,
    updateProductRam,
    updateProductWeight,
};
