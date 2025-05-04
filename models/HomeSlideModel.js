import mongoose from 'mongoose';

const homeSlideSchema = mongoose.Schema(
    {
        image: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            // required: true,
        },
        dateCreated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

const HomeSlideModel = mongoose.model('homeSlide', homeSlideSchema);
export default HomeSlideModel;
