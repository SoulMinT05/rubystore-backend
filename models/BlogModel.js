import mongoose from 'mongoose';

const blogSchema = mongoose.Schema(
    {
        name: {
            type: String,
            default: '',
        },
        slug: {
            type: String,
        },
        images: [
            {
                type: String,
            },
        ],
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const BlogModel = mongoose.model('blog', blogSchema);
export default BlogModel;
