const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const productModel = require("../models/productModel");
const productCategoryModel = require("../models/prdCategoryModel");
/**
 * ROUTER CREATE PRODUCTS
 */
const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await productModel.create(req.body);
        if (!newProduct)
            res.json({
                success: false,
                message: "Thêm sản phẩm không thành công",
            });
        res.json({
            success: true,
            message: "Thêm thành công",
            newProduct,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 * ROUTER UPDATE PRODUCTS
 */
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }

        const updateProduct = await productModel.findByIdAndUpdate(
            id,
            req.body,
            {
                new: true,
            }
        );
        if (!updateProduct)
            res.json({
                success: false,
                message: "Cập nhật thất bại",
            });
        res.json({
            success: true,
            message: "Cập nhật thành công",
            updateProduct,
        });
    } catch (error) {
        res.json({
            success: false,
            message: "Server Error",
        });
    }
});

/**
 * ROUTER DELETE PRODUCTS
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const deleteProduct = await productModel.findByIdAndDelete(id);
        if (!deleteProduct)
            res.json({
                success: false,
                message: "Xoá thất bại",
            });
        res.json({
            success: true,
            message: "Xoá thành công",
            deleteProduct,
        });
    } catch (error) {
        res.json({
            success: false,
            message: "Server Error",
        });
    }
});

/**
 * ROUTER GET A PRODUCTS
 */
const getaProducts = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    try {
        const findProduct = await productModel.findOne({ slug: slug });

        if (!findProduct) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }
        res.json({ product: findProduct });
    } catch (error) {
        throw new Error(error);
    }
});

/**
 * ROUTER GET ALL PRODUCTS
 */
const getAllProducts = asyncHandler(async (req, res) => {
    try {
        /**
         * Filtering
         */
        const queryObj = {
            ...req.query,
        };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );

        let query = productModel.find(JSON.parse(queryStr));

        /**
         * Sorting
         */
        if (req.query.sort) {
            const sortBy = req.query.sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        /**
         *  limiting the fields
         */
        if (req.query.fields) {
            const fields = req.query.fields.split(",").join(" ");
            query = query.select(fields);
        } else {
            query = query.select("-__v");
        }

        /**
         * pagination
         */
        const page = req.query.page;
        const limit = req.query.limit;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);

        if (req.query.page) {
            const productCount = await productModel.countDocuments();
            if (skip >= productCount)
                throw new Error("This Page does not exists");
        }

        const product = await query;
        if (!product)
            res.json({
                success: false,
                message: "Không có sản phẩm nào",
            });
        res.json({
            success: true,
            message: "tất cả sản phẩm",
            product,
        });
    } catch (error) {
        throw new Error(error);
    }
});

const getProductCategory = asyncHandler(async (req, res) => {
    try {
        /**
         * Filtering
         */
        const queryObj = {
            ...req.query,
        };
        const excludeFields = ["page", "sort", "limit", "fields"];
        excludeFields.forEach((el) => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt)\b/g,
            (match) => `$${match}`
        );

        let query = productModel.find(JSON.parse(queryStr));

        /**
         * Filtering by category
         */
        if (req.params) {
            // Lấy slug danh mục từ req.params.category
            const { slug } = req.params;

            // Tìm danh mục có slug tương ứng trong cơ sở dữ liệu
            const categoryDoc = await productCategoryModel.findOne({
                slug: slug,
            });
            if (categoryDoc) {
                // Nếu danh mục tồn tại, lọc sản phẩm theo danh mục
                query = query.where("category").equals(categoryDoc.title);
            } else {
                // Nếu không tìm thấy danh mục, trả về kết quả rỗng
                return res.json({
                    success: false,
                    message: "Danh mục không tồn tại",
                    product: [],
                });
            }
        }

        /**
         * Sorting, Limiting the fields, Pagination
         */
        // Sắp xếp theo giá nếu được chỉ định
        if (req.query.sort) {
            query = query.sort(req.query.sort);
        }

        // Lấy trang hiện tại từ req.query.page (mặc định là 1 nếu không có)
        const currentPage = parseInt(req.query.page) || 1;

        // Giới hạn số lượng sản phẩm trả về trên mỗi trang
        const limitPerPage =
            parseInt(req.query.limit) || Number.MAX_SAFE_INTEGER;

        // Đếm số lượng sản phẩm
        const totalProducts = await productModel.countDocuments(query);

        // Sử dụng phân trang để lấy chỉ một trang sản phẩm
        const startIndex = (currentPage - 1) * limitPerPage;
        const endIndex = currentPage * limitPerPage;

        query = query.skip(startIndex).limit(limitPerPage);

        const product = await query;

        if (!product || product.length === 0) {
            return res.json({
                success: false,
                message: "Không có sản phẩm nào",
                product: [],
            });
        }

        // Tính toán thông tin về phân trang
        const pagination = {};

        if (endIndex < totalProducts) {
            pagination.next = {
                page: currentPage + 1,
                limit: limitPerPage,
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: currentPage - 1,
                limit: limitPerPage,
            };
        }

        res.json({
            success: true,
            message: "Tất cả sản phẩm",
            product,
            pagination,
        });
    } catch (error) {
        throw new Error(error);
    }
});

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, prodId, comment } = req.body;
    try {
        const product = await productModel.findById(prodId);
        let alreadyRated = product.ratings.find(
            (userId) => userId.postedby.toString() === _id.toString()
        );
        if (alreadyRated) {
            const updateRating = await productModel.updateOne(
                {
                    ratings: {
                        $elemMatch: alreadyRated,
                    },
                },
                {
                    $set: {
                        "ratings.$.star": star,
                        "ratings.$.comment": comment,
                    },
                },
                {
                    new: true,
                }
            );
        } else {
            const rateProduct = await productModel.findByIdAndUpdate(
                prodId,
                {
                    $push: {
                        ratings: {
                            star: star,
                            comment: comment,
                            postedby: _id,
                        },
                    },
                },
                {
                    new: true,
                }
            );
        }
        const getallratings = await productModel.findById(prodId);
        let totalRating = getallratings.ratings.length;
        let ratingsum = getallratings.ratings
            .map((item) => item.star)
            .reduce((prev, curr) => prev + curr, 0);
        let actualRating = Math.round(ratingsum / totalRating);
        let finalproduct = await productModel.findByIdAndUpdate(
            prodId,
            {
                totalrating: actualRating,
            },
            {
                new: true,
            }
        );
        res.json(finalproduct);
    } catch (error) {
        throw new Error(error);
    }
});
const uploadImage = asyncHandler(async (req, res) => {
    // Lấy giá trị id từ tuyến đường
    console.log("hi", req); // Kiểm tra xem có file đã tải lên không
});
module.exports = {
    createProduct,
    getaProducts,
    getAllProducts,
    getProductCategory,
    updateProduct,
    deleteProduct,
    rating,
    uploadImage,
};
