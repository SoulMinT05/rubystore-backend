import HomeSlideModel from '../models/HomeSlideModel.js';

import { v2 as cloudinary } from 'cloudinary';
import StaffModel from '../models/StaffModel.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    secure: true,
});

const createHomeSlideImage = async (req, res) => {
    try {
        const image = req.file; // 1 ảnh
        if (!image) {
            return res.status(400).json({ success: false, message: 'Không có ảnh nào được gửi lên' });
        }

        const uploaded = await cloudinary.uploader.upload(image.path, {
            folder: 'rubystore',
        });
        const newHomeSlide = await HomeSlideModel.create({
            image: uploaded.url,
            isActive: req.body.isActive,
        });
        console.log('newHomeSlide: ', newHomeSlide);

        return res.status(201).json({
            success: true,
            message: 'Tạo slide thành công',
            newHomeSlide,
        });
    } catch (error) {
        console.error('Create category error: ', error);
        return res.status(500).json({
            success: false,
            message: error.message || error,
        });
    }
};

const getAllHomeSlidesFromUser = async (req, res) => {
    try {
        const homeSlides = await HomeSlideModel.find().sort({ order: 1 }); // sắp xếp theo thứ tự
        res.status(200).json({ success: true, homeSlides });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const getAllHomeSlidesFromAdmin = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('useRID: ', userId);
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

        const [homeSlides, totalHomeSlides] = await Promise.all([
            HomeSlideModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
            HomeSlideModel.countDocuments(filter),
        ]);

        // const homeSlides = await HomeSlideModel.find().sort({ order: 1 }); // sắp xếp theo thứ tự
        res.status(200).json({
            success: true,
            homeSlides,
            totalPages: Math.ceil(totalHomeSlides / perPage),
            totalHomeSlides,
            page,
            perPage,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const getDetailsHomeSlide = async (req, res) => {
    try {
        const homeSlide = await HomeSlideModel.findById(req.params.id);
        if (!homeSlide) {
            return res.status(404).json({
                success: false,
                message: 'Không có slide này',
            });
        }
        res.status(200).json({ success: true, homeSlide });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateHomeSlide = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {};

        if (typeof req.body.isActive !== 'undefined') {
            updateData.isActive = req.body.isActive;
        }

        if (req.file) {
            const uploaded = await cloudinary.uploader.upload(req.file.path);
            updateData.image = uploaded.url;
        }

        const updatedSlide = await HomeSlideModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedSlide) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy slide' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật slide thành công', slide: updatedSlide });
    } catch (error) {
        console.error('Lỗi cập nhật slide:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteHomeSlide = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedSlide = await HomeSlideModel.findByIdAndDelete(id);

        if (!deletedSlide) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy slide để xoá' });
        }
        if (deletedSlide.image) {
            const urlArr = deletedSlide.image.split('/');
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

const deleteMultipleHomeSlide = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({
                success: false,
                message: 'Cần cung cấp id home slide',
            });
        }

        const homeSlides = await HomeSlideModel.find({ _id: { $in: ids } });
        const destroyImagePromises = homeSlides.flatMap((product) => {
            const images = product.images || [];
            return images.map((img) => {
                const urlArr = img.split('/');
                const image = urlArr[urlArr.length - 1];
                const imageName = image.split('.')[0];
                return cloudinary.uploader.destroy(imageName);
            });
        });

        await Promise.all(destroyImagePromises);

        // Xoá tất cả home slide
        await HomeSlideModel.deleteMany({ _id: { $in: ids } });
        return res.status(200).json({
            success: true,
            message: 'Xoá home slide thành công',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error,
        });
    }
};

export {
    createHomeSlideImage,
    getDetailsHomeSlide,
    getAllHomeSlidesFromUser,
    getAllHomeSlidesFromAdmin,
    updateHomeSlide,
    deleteHomeSlide,
    deleteMultipleHomeSlide,
};
