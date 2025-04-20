import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads'); // Lưu file vào thư mục 'uploads'
//     },
//     filename: function (req, file, cb) {
//         cb(null, `${Date.now()}_${file.originalname}`); // Đặt tên file kèm timestamp
//     },
// });

const storage = new CloudinaryStorage({
    cloudinary,
    allowedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    params: {
        folder: 'rubystore',
    },
});

const upload = multer({ storage });

export default upload;
