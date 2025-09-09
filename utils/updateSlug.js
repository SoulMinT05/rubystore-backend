import mongoose from 'mongoose';
import slugify from 'slugify';
import ProductModel from '../models/ProductModel.js'; // chỉnh path cho đúng
import BlogModel from '../models/BlogModel.js';
import CategoryModel from '../models/CategoryModel.js';

// const MONGO_URI = process.env.MONGODB_URI;
const MONGO_URI = 'mongodb://127.0.0.1:27017/rubystore';

// Hàm loại bỏ dấu tiếng Việt
function removeVietnameseTones(str) {
    // return str
    //     .normalize('NFD') // chuẩn hóa Unicode
    //     .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
    //     .replace(/đ/g, 'd')
    //     .replace(/Đ/g, 'D');
    return str
        .normalize('NFD') // chuẩn hóa Unicode
        .replace(/[\u0300-\u036f]/g, '') // loại bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[,/&]/g, ' ') // thay dấu phẩy, /, & thành khoảng trắng
        .replace(/\s+/g, ' ') // gộp nhiều khoảng trắng
        .trim();
}

const updateSlug = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const products = await CategoryModel.find({ slug: { $exists: false } }); // tìm product chưa có slug
        console.log(`🔍 Found ${products.length} products without slug`);

        for (let product of products) {
            const cleanName = removeVietnameseTones(product.name);
            product.slug = slugify(cleanName, { lower: true, strict: true });
            await product.save();
            console.log(`✔ Updated slug for: ${product.name} → ${product.slug}`);
        }

        console.log('🎉 All slugs updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating slugs:', error);
        process.exit(1);
    }
};

const updateParentCategorySlug = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Tìm tất cả category
        const categories = await CategoryModel.find({});
        console.log(`🔍 Found ${categories.length} categories`);

        for (let category of categories) {
            if (category.parentCategoryName) {
                const cleanName = removeVietnameseTones(category.parentCategoryName);
                const newParentSlug = slugify(cleanName, { lower: true, strict: true });

                if (category.parentCategorySlug !== newParentSlug) {
                    category.parentCategorySlug = newParentSlug;
                    await category.save();
                    console.log(`✔ Updated parentCategorySlug for: ${category.name} → ${newParentSlug}`);
                }
            } else {
                // Nếu không có parentCategoryName thì để rỗng
                if (category.parentCategorySlug !== '') {
                    category.parentCategorySlug = '';
                    await category.save();
                    console.log(`✔ Cleared parentCategorySlug for: ${category.name}`);
                }
            }
        }

        console.log('🎉 All parentCategorySlug updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating parentCategorySlug:', error);
        process.exit(1);
    }
};

// updateSlug();
updateParentCategorySlug();
