import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true }, // mã voucher
        discountType: { type: String, enum: ['percent', 'fixed'], required: true }, // loại giảm giá
        discountValue: { type: Number, required: true }, // giá trị giảm (vd: 20% hoặc 300000)
        minOrderValue: { type: Number, default: 0 }, // giá trị tối thiểu của đơn
        expiresAt: { type: Date, required: true }, // thời hạn sử dụng
        isActive: { type: Boolean, default: true },
        isUsed: { type: Boolean, default: false },
        quantityVoucher: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

const VoucherModel = mongoose.model('voucher', voucherSchema);
export default VoucherModel;
