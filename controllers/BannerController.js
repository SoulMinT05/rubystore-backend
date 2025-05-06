import BannerModel from '../models/BannerModel.js';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const createBanner = async (req, res) => {
    try {
        const { name, productId, categoryId, subCategoryId, thirdSubCategoryId, price, align } = req.body;
        const images = req.files; // nhiều ảnh

        if (!name) {
            return res.status(500).json({
                success: false,
                message: 'Cần điền tên banner',
            });
        }

        let imageUrls = [];
        if (images && images.length > 0) {
            imageUrls = await Promise.all(
                images?.map(async (img) => {
                    const uploadedImage = await cloudinary.uploader.upload(img.path, {
                        folder: 'rubystore',
                    });
                    return uploadedImage.url; // trả về URL ảnh đã tải lên
                }),
            );
        }

        const newBanner = await BannerModel.create({
            name,
            images: imageUrls,
            categoryId,
            subCategoryId,
            thirdSubCategoryId,
            price,
            align,
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo banner thành công',
            newBanner,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getBanners = async (req, res) => {
    try {
        const banners = await BannerModel.find();
        if (!banners) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy banner',
            });
        }
        return res.status(200).json({
            success: true,
            banners,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};
const getBanner = async (req, res) => {
    try {
        const banner = await BannerModel.findById(req.params.id);
        if (!banner) {
            return res.status(500).json({
                success: false,
                message: 'Không tìm thấy banner',
            });
        }
        return res.status(200).json({
            success: true,
            banner,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};
const updateBanner = async (req, res) => {
    try {
        const banner = await BannerModel.findById(req.params.id);
        if (!banner) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy banner',
            });
        }

        const deletedImages = req.body.deletedImages || []; // array các URL cần xoá
        if (deletedImages.length > 0) {
            banner.images = banner.images.filter((img) => !deletedImages.includes(img));
        }

        // --- Thêm ảnh mới nếu có ---
        const newImages = req.files?.map((file) => file.path) || [];
        if (newImages.length > 0) {
            // Sử dụng Promise.all để xử lý nhiều ảnh cùng một lúc
            await Promise.all(
                newImages.map((image) => {
                    return banner.images.push(image); // Đẩy ảnh vào mảng images
                }),
            );
        }

        // --- Cập nhật tên và danh mục cha ---
        banner.name = req.body.name || banner.name;
        banner.productId = req.body.productId || banner.productId;
        banner.categoryId = req.body.categoryId || banner.categoryId;
        banner.subCategoryId = req.body.subCategoryId || banner.subCategoryId;
        banner.thirdSubCategoryId = req.body.thirdSubCategoryId || banner.thirdSubCategoryId;
        banner.price = req.body.price || banner.price;
        banner.align = req.body.align || banner.align;
        await banner.save();

        return res.status(200).json({
            success: true,
            message: 'Cập nhật banner thành công',
            updatedBanner: banner,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
        });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBanner = await BannerModel.findByIdAndDelete(id);

        if (!deletedBanner) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy banner để xoá' });
        }
        if (deletedBanner.image) {
            const urlArr = deletedBanner.image.split('/');
            const publicIdWithExt = urlArr[urlArr.length - 1];
            const publicId = publicIdWithExt.split('.')[0];
            await cloudinary.uploader.destroy(`rubystore/${publicId}`);
        }

        res.status(200).json({ success: true, message: 'Xoá slide thành công' });
    } catch (error) {
        console.error('Lỗi xoá slide:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteMultipleBanner = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp id banner',
            });
        }
        const banners = await BannerModel.find({ _id: { $in: ids } });
        const destroyImagePromises = banners.flatMap((product) => {
            const images = product.images || [];
            return images.map((img) => {
                const urlArr = img.split('/');
                const image = urlArr[urlArr.length - 1];
                const imageName = image.split('.')[0];
                return cloudinary.uploader.destroy(imageName);
            });
        });

        await Promise.all(destroyImagePromises);

        // Xoá tất cả banner
        await BannerModel.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: 'Xoá banner thành công',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

export { createBanner, getBanners, getBanner, updateBanner, deleteBanner, deleteMultipleBanner };
