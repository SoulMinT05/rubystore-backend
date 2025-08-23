import UserModel from '../models/UserModel.js';
import ProductModel from '../models/ProductModel.js';
import ProductRamModel from '../models/ProductRamModel.js';
import ProductWeightModel from '../models/ProductWeightModel.js';
import ProductSizeModel from '../models/ProductSizeModel.js';

import redisClient from '../config/redis.js';

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
                })
            );
        }
        const newProduct = await ProductModel.create({
            name,
            images: imageUrls,
            description,
            brand,
            price:
                price !== undefined ? price : oldPrice && discount ? oldPrice - (oldPrice * discount) / 100 : oldPrice,
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
                message: 'Tạo cân nặng sản phẩm thất bại!',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Tạo cân nặng sản phẩm thành công',
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

const createProductSize = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Cần nhập size sản phẩm',
            });
        }

        const existingProductSize = await ProductSizeModel.findOne({ name });
        if (existingProductSize) {
            return res.status(400).json({
                success: false,
                message: 'Size này đã tồn tại!',
            });
        }

        const newProductSize = await ProductSizeModel.create({
            name,
        });
        if (!newProductSize) {
            return res.status(400).json({
                success: false,
                message: 'Tạo size sản phẩm thất bại!',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Tạo size sản phẩm thành công',
            newProductSize,
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
        const perPage = parseInt(req.query.perPage) || 10;
        const totalProducts = await ProductModel.countDocuments({ isPublished: true });
        const totalPages = Math.ceil(totalProducts / perPage);

        if (page > totalPages) {
            return res.status(404).json({
                success: false,
                message: 'Trang không tìm thấy',
            });
        }

        // // Kiểm tra nếu có Redis
        const cachedProducts = await redisClient.get(`products:user?page=${page}&perPage=${perPage}`);
        if (cachedProducts) {
            console.log('Lấy products user từ Cache');
            return res.status(200).json({
                success: true,
                products: JSON.parse(cachedProducts),
                totalPages,
                page,
            });
        }
        // Nếu không có cache, lấy từ DB
        console.log('Lấy products user từ DB');
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

        // Lưu vào Redis với TTL
        redisClient.setex(
            `products:user?page=${page}&perPage=${perPage}`,
            parseInt(process.env.DEFAULT_EXPIRATION),
            JSON.stringify(products)
        );

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
                message: 'Không tìm thấy cân nặng sản phẩm',
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

const getProductsSize = async (req, res) => {
    try {
        const productsSize = await ProductSizeModel.find();
        if (!productsSize) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy size sản phẩm',
            });
        }
        return res.status(200).json({
            success: true,
            productsSize,
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
        })
            .populate('category')
            .sort({ createdAt: -1 });

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

const deleteProductSize = async (req, res) => {
    try {
        const productSize = await ProductSizeModel.findByIdAndDelete(req.params.id);
        if (!productSize) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        return res.status(200).json({
            success: true,
            deletedProductSize: productSize,
            message: 'Xoá size sản phẩm thành công',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const deleteMultipleProductSize = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp id size sản phẩm',
            });
        }

        const productsSize = await ProductSizeModel.find({ _id: { $in: ids } });

        // Xoá tất cả sản phẩm
        await ProductSizeModel.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: 'Xoá size sản phẩm thành công',
            productsSize,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

const getDetailsProductFromUser = async (req, res) => {
    try {
        const productId = req.params.id;
        const cacheKey = `product:user:${productId}`;

        // Kiểm tra cache
        const cacheDetailsProduct = await redisClient.get(cacheKey);
        if (cacheDetailsProduct) {
            console.log('Lấy details product từ cache');
            return res.status(200).json({
                success: true,
                product: JSON.parse(cacheDetailsProduct),
            });
        }

        // Query DB
        console.log('Lấy details product từ DB');
        const product = await ProductModel.findById(productId).populate('category');
        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy sản phẩm với id này',
            });
        }

        redisClient.setex(cacheKey, process.env.DEFAULT_EXPIRATION, JSON.stringify(product));

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
        const {
            name,
            description,
            brand,
            price,
            oldPrice,
            categoryName,
            categoryId,
            category,
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

        const numericOldPrice = Number(oldPrice);
        const numericDiscount = Number(discount);
        const numericPrice =
            price !== undefined
                ? Number(price)
                : numericOldPrice && numericDiscount
                ? numericOldPrice - (numericOldPrice * numericDiscount) / 100
                : numericOldPrice;

        const product = await ProductModel.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                brand,
                price: numericPrice,
                oldPrice: numericOldPrice,
                categoryName,
                categoryId,
                category,
                subCategoryId,
                subCategoryName,
                thirdSubCategoryId,
                thirdSubCategoryName,
                countInStock,
                rating,
                isFeatured,
                isPublished,
                discount: numericDiscount,
                productRam,
                productSize,
                productWeight,
            },
            { new: true }
        );

        if (!product) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        let deletedImages = [];
        try {
            const raw = req.body.deletedImages;
            deletedImages = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn('Không thể parse deletedImages:', e);
            deletedImages = [];
        }

        // --- Xoá ảnh cũ nếu có deletedImages ---
        if (deletedImages.length > 0) {
            product.images = product.images.filter((img) => !deletedImages.includes(img));

            await Promise.all(
                deletedImages.map(async (url) => {
                    try {
                        const urlArr = url.split('/');
                        const imageWithExt = urlArr[urlArr.length - 1];
                        const publicId = imageWithExt.split('.')[0];
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId);
                        }
                    } catch (err) {
                        console.warn(`Không thể xoá ảnh Cloudinary: ${url}`, err);
                    }
                })
            );
        }

        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map(async (img) => {
                    const uploadedImage = await cloudinary.uploader.upload(img.path);
                    return uploadedImage.url;
                })
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
            { new: true }
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
            { new: true }
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
            message: 'Cập nhật cân nặng sản phẩm thành công',
            updatedProductWeight: productWeight,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const updateProductSize = async (req, res) => {
    try {
        const productSize = await ProductSizeModel.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
            },
            { new: true }
        );

        if (!productSize) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy sản phẩm',
            });
        }

        await productSize.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật size sản phẩm thành công',
            updatedProductSize: productSize,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const filterProducts = async (req, res) => {
    const {
        categoryId,
        subCategoryId,
        thirdSubCategoryId,
        minPrice,
        maxPrice,
        rating,
        page,
        limit,
        keyword,
        stockStatus,
    } = req.body;

    const filters = {};
    if (categoryId?.length) {
        filters.categoryId = { $in: categoryId };
    }
    if (subCategoryId?.length) {
        filters.subCategoryId = { $in: subCategoryId };
    }
    if (thirdSubCategoryId?.length) {
        filters.thirdSubCategoryId = { $in: thirdSubCategoryId };
    }
    if (minPrice || maxPrice) {
        filters.price = {
            $gte: +minPrice || 0,
            $lte: +maxPrice || Infinity,
        };
    }
    if (rating?.length) {
        filters.rating = { $in: rating };
    }

    if (stockStatus === 'available') {
        filters.countInStock = { $gt: 0 };
    } else if (stockStatus === 'unavailable') {
        filters.countInStock = 0;
    }

    // ✅ Thêm lọc theo keyword (name hoặc description)
    if (keyword && keyword.trim() !== '') {
        const regex = new RegExp(keyword.trim(), 'i'); // không phân biệt hoa thường
        filters.$or = [
            { name: { $regex: regex } },
            // { description: { $regex: regex } },
            // { categoryName: { $regex: regex } },
            // { subCategoryName: { $regex: regex } },
            // { thirdSubCategoryName: { $regex: regex } },
            // { brand: { $regex: regex } },
        ];
    }

    try {
        const products = await ProductModel.find(filters)
            .populate('category')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await ProductModel.countDocuments(filters);

        return res.status(200).json({
            success: true,
            products,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const sortByCriteria = (products, sortBy, order) => {
    if (!Array.isArray(products)) {
        console.error('Products is not an array:', products);
        return [];
    }
    return products.sort((a, b) => {
        if (sortBy === 'name') {
            return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortBy === 'price') {
            return order === 'asc' ? a.price - b.price : b.price - a.price;
        }
        return 0;
    });
};

const sortProducts = async (req, res) => {
    try {
        const { products, sortBy, order } = req.body;
        const sortedProducts = sortByCriteria([...products], sortBy, order);

        return res.status(200).json({
            success: true,
            products: sortedProducts,
            page: 0,
            totalPages: 0,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const searchProducts = async (req, res) => {
    try {
        let { query } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm' });
        }

        query = query.trim(); // ✅ Trim whitespace
        if (query === '') {
            return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm' });
        }

        const cachedSearchProducts = await redisClient.get(`search:${query}`);
        if (cachedSearchProducts) {
            console.log('📌 Lấy search product từ cache:', query);
            return res.status(200).json({
                success: true,
                products: JSON.parse(cachedSearchProducts),
            });
        }

        // Regex tìm name hoặc description chứa từ khóa (không phân biệt hoa thường)
        const regex = new RegExp(query, 'i');

        const products = await ProductModel.find({
            $or: [
                { name: { $regex: regex } },
                // { description: { $regex: regex } },
                // { categoryName: { $regex: regex } },
                // { subCategoryName: { $regex: regex } },
                // { thirdSubCategoryName: { $regex: regex } },
                // { brand: { $regex: regex } },
            ],
        });
        redisClient.setex(`search:${query}`, process.env.DEFAULT_EXPIRATION, JSON.stringify(products));

        console.log('📌 Lấy search product từ DB:', query);

        return res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const searchProductResults = async (req, res) => {
    let { keyword } = req.query;
    if (!keyword) {
        return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm' });
    }

    keyword = keyword.trim(); // ✅ Trim whitespace
    if (keyword === '') {
        return res.status(400).json({ success: false, message: 'Thiếu từ khóa tìm kiếm' });
    }
    try {
        const cachedSearchProducts = await redisClient.get(`search:${keyword}`);
        if (cachedSearchProducts) {
            console.log('📌 Lấy search product results từ cache:', keyword);
            return res.status(200).json({
                success: true,
                products: JSON.parse(cachedSearchProducts),
            });
        }

        const regex = new RegExp(keyword, 'i'); // không phân biệt hoa thường
        const products = await ProductModel.find({
            $or: [{ name: { $regex: regex } }],
        });

        // Save vào cache
        redisClient.setex(`search:${keyword}`, process.env.DEFAULT_EXPIRATION, JSON.stringify(products));

        console.log('📌 Lấy search product results từ DB:', keyword);

        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const saveSearchHistory = async (req, res) => {
    try {
        const userId = req.user._id; // Lấy từ middleware verifyToken
        const { keyword } = req.body;

        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Từ khóa không hợp lệ',
            });
        }

        // Cập nhật searchHistory (thêm đầu mảng, không trùng nhau)
        const user = await UserModel.findById(userId);

        // Nếu đã tồn tại thì xóa để đưa lên đầu
        user.searchHistory = user.searchHistory.filter((item) => item !== keyword.trim());
        user.searchHistory.unshift(keyword.trim());

        // Giới hạn lịch sử tìm kiếm tối đa 10 mục
        user.searchHistory = user.searchHistory.slice(0, 10);

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Lưu từ khóa thành công',
            searchHistory: user.searchHistory,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getSearchProductsHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        return res.status(200).json({
            success: true,
            history: user.searchHistory.slice(0, 10),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
    }
};

export {
    createProduct,
    createProductRam,
    createProductWeight,
    createProductSize,
    getProductsAdmin,
    getProductsUser,
    getProductsRam,
    getProductsWeight,
    getProductsSize,
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
    deleteProductSize,
    deleteMultipleProductSize,
    getDetailsProductFromUser,
    removeImageFromCloudinary,
    updateProduct,
    updateProductRam,
    updateProductWeight,
    updateProductSize,
    filterProducts,
    sortProducts,
    searchProducts,
    saveSearchHistory,
    getSearchProductsHistory,
    searchProductResults,
};
