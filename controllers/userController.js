const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const uniqid = require("uniqid");
const asyncHandler = require("express-async-handler");
const userModel = require("../models/userModel");
const { generateToken } = require("../configs/jwtToken");
const { generateRefreshToken } = require("../configs/refreshToken");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const couponModel = require("../models/couponModel");
const orderModel = require("../models/orderModel");
const addressModel = require("../models/addressModel");

/**
 *  ROUTER REGISTER USER
 *
 */

function invalidCredentials(res) {
    return res.status(400).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng",
    });
}

const createUser = asyncHandler(async (req, res) => {
    const { firstname, phone, password } = req.body;
    try {
        let user = await userModel.findOne({ phone });

        if (user)
            return res
                .status(400)
                .json({ success: false, message: "Tài khoản đã tồn tại" });
        if (!phone || !password || !firstname)
            return res.status(400).json({
                success: false,
                message: "Các trường không được để trống",
            });
        // if (!validator.isEmail(email))
        //     return res
        //         .status(400)
        //         .json({ success: false, message: "Email không hợp lệ" });
        if (!validator.isStrongPassword(password))
            return res
                .status(400)
                .json({ success: false, message: "Password không hợp lệ" });

        user = new userModel({
            firstname,
            lastname: "",
            avatar: "https://res.cloudinary.com/dfnwjuvbc/image/upload/v1711101114/images/en0yhhjtsilnaqakjifo.png",
            phone,
            password,
        });
        const hasPassword = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, hasPassword);
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Tạo thành công",
            _id: user._id,
            phone: user.phone,
            firstname: user.firstname,
            lastname: user.lastname,
            token,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 *  ROUTER LOGIN USER
 *
 */
const loginUser = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;
    console.log(phone, password);
    try {
        let user = await userModel.findOne({ phone });

        if (!user)
            return res.status(401).json({
                success: false,
                message: "Thông tin đăng nhập không đúng",
            });

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword)
            return res.status(401).json({
                success: false,
                message: "Thông tin đăng nhập không đúng",
            });

        const refreshToken = await generateRefreshToken(user._id);

        // Cập nhật refreshToken vào cơ sở dữ liệu
        await userModel.findByIdAndUpdate(user._id, {
            refreshToken: refreshToken,
        });

        // Đặt refreshToken vào cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000, // 72 giờ
        });

        // Trả về refreshToken và token khi đăng nhập thành công
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            _id: user._id,
            phone: user.phone,
            firstname: user.firstname,
            lastname: user.lastname,
            avatar: user.avatar,
            token: refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 *  ROUTER LOGIN ADMIN
 *
 */
const loginAdmin = asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    try {
        let admin = await userModel.findOne({ phone, role: "admin" });

        if (!admin || admin.role !== "admin") {
            return res.status(400).json({
                success: false,
                message: "Tên đăng nhập hoặc mật khẩu không đúng",
            });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: "Tên đăng nhập hoặc mật khẩu không đúng",
            });
        }

        // Refresh token
        const refreshToken = await generateRefreshToken(admin?._id);
        const updateUserToken = await userModel.findByIdAndUpdate(
            admin?._id,
            {
                refreshToken: refreshToken,
            },
            {
                new: true,
            }
        );

        res.cookie("refreshToken", updateUserToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            _id: admin._id,
            phone: admin.phone,
            email: admin?.email,
            firstname: admin?.firstname,
            lastname: admin?.lastname,
            token: generateToken(admin?._id),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 *  ROUTER LOGOUT USER
 *
 */
const logoutUser = asyncHandler(async (req, res) => {
    const cookie = req.cookie;
    try {
        if (!cookie.refreshToken) throw new Error("No Refresh token in cookie");
        const refreshToken = cookie.refreshToken;
        const user = await userModel.findOne({ refreshToken });

        if (!user) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true,
            });
            return res.sendStatus(204);
        }
        await userModel.findOneAndUpdate(
            { refreshToken: refreshToken },
            { refreshToken: "" }
        );

        res.clearCookie("refreshToken", {
            historyOnly: true,
            secure: true,
        });
        res.sendStatus(204);
    } catch (error) {}
});

/**
 *  ROUTER UPDATE USER
 *
 */

const updateUser = asyncHandler(async (req, res) => {
    try {
        const userIdToUpdate = req.params.id.toString(); // ID của người dùng cần cập nhật
        const loggedInUserId = req.user._id.toString(); // ID của người dùng hiện tại

        console.log(loggedInUserId, userIdToUpdate);
        // Kiểm tra nếu người dùng hiện tại không phải là tài khoản admin
        if (req.user.role !== "admin") {
            // Nếu không phải admin, chỉ cho phép cập nhật tài khoản của chính họ
            if (userIdToUpdate !== loggedInUserId) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Bạn không có quyền cập nhật thông tin người dùng khác.",
                });
            }
        }

        // Tiếp tục chỉ khi người dùng là tài khoản admin hoặc cập nhật tài khoản của chính họ
        const updateUsers = await userModel
            .findByIdAndUpdate(
                userIdToUpdate,
                {
                    firstname: req.body.firstname || "",
                    lastname: req.body.lastname || "",
                    phone: req.body.phone || "",
                    email: req.body.email || "",
                    address: req.body.address || "",
                    gender: req.body.gender || "",
                    birthday: req.body.birthday || "",
                    avatar: req.body.avatar || "",
                },
                {
                    new: true,
                }
            )
            .select("-password");
        console.log(req.body.firstname, userIdToUpdate);
        res.json({
            success: true,
            message: "Cập nhật thông tin người dùng thành công",
            _id: updateUsers._id,
            phone: updateUsers.phone,
            role: updateUsers.role,
            cart: updateUsers.cart,
            orders: updateUsers.orders,
            address: updateUsers.address,
            avatar: updateUsers.avatar,
            birthday: updateUsers.birthday,
            email: updateUsers.email,
            firstname: updateUsers.firstname,
            lastname: updateUsers.lastname,
            gender: updateUsers.gender,
            token: updateUsers.refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 *  ROUTER DELETE USER
 *
 */
const deleteUser = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const deleteUsers = await userModel.findByIdAndDelete(id);
        if (!deleteUsers)
            res.status(401).json({
                success: false,
                message: "Người dùng không tồn tại",
            });
        res.json({ success: true, message: "Xoá thành công", deleteUsers });
    } catch (error) {}
});

/**
 *  ROUTER GET ONE USER
 *
 */
const getOneUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const user = await userModel.findById(id);
        res.status(200).json({
            _id: user._id,
            success: true,
            phone: user.phone,
            role: user.role,
            cart: user.cart,
            orders: user.orders,
            address: user.address,
            avatar: user.avatar,
            birthday: user.birthday,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            gender: user.gender,
            token: user.refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 *  ROUTER GET ALL USER
 *
 */
const getAllUser = asyncHandler(async (req, res) => {
    try {
        const users = await userModel.find();
        res.status(200).json({ success: true, user: users });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 *  ROUTER CART USER
 *
 */
const userCart = asyncHandler(async (req, res) => {
    const { cart } = req.body;
    const { _id } = req.user;

    try {
        const user = await userModel.findById(_id.toString());

        let alreadyExistCart = await cartModel.findOne({ orderby: user._id });

        if (!alreadyExistCart) {
            // Tạo giỏ hàng mới nếu chưa tồn tại
            const products = [];
            for (let i = 0; i < cart.length; i++) {
                const productDetails = await productModel
                    .findById(cart[i]._id)
                    .exec();

                const newProduct = {
                    product: cart[i]._id,
                    title: productDetails.title,
                    image: productDetails.image,
                    slug: productDetails.slug,
                    price: productDetails.price,
                    category: productDetails.category,
                    count: cart[i].count,
                };
                products.push(newProduct);
            }

            let cartTotal = 0;
            let totalCount = 0;
            for (let i = 0; i < products.length; i++) {
                cartTotal += products[i].price * products[i].count;
                totalCount += products[i].count;
            }
            const newCart = await new cartModel({
                products,
                cartTotal,
                totalCount,
                orderby: user._id,
            }).save();
            console.log(newCart);
            res.json(newCart);
        } else {
            // Cập nhật giỏ hàng nếu đã tồn tại
            for (let i = 0; i < cart.length; i++) {
                const productInCart = alreadyExistCart.products.find(
                    (p) => p.product.toString() === cart[i]._id
                );
                if (productInCart) {
                    // Nếu sản phẩm đã tồn tại trong giỏ hàng cũ, cập nhật số lượng
                    productInCart.count += cart[i].count;
                } else {
                    // Nếu sản phẩm mới, thêm vào danh sách sản phẩm cập nhật
                    const productDetails = await productModel
                        .findById(cart[i]._id)
                        .exec();
                    const newProduct = {
                        product: cart[i]._id,
                        title: productDetails.title,
                        image: productDetails.image,
                        slug: productDetails.slug,
                        price: productDetails.price,
                        category: productDetails.category,
                        count: cart[i].count,
                    };
                    alreadyExistCart.products.push(newProduct);
                }
            }

            // Tính toán lại tổng giá tiền và tổng count của giỏ hàng
            let cartTotal = 0;
            let totalCount = 0;
            for (let i = 0; i < alreadyExistCart.products.length; i++) {
                cartTotal +=
                    alreadyExistCart.products[i].price *
                    alreadyExistCart.products[i].count;
                totalCount += alreadyExistCart.products[i].count;
            }
            alreadyExistCart.cartTotal = cartTotal;
            alreadyExistCart.totalCount = totalCount;

            // Lưu lại giỏ hàng đã cập nhật
            await alreadyExistCart.save();
            res.json(alreadyExistCart);
        }
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

// Update cart

const userUpdateCart = asyncHandler(async (req, res) => {
    const { productId, quantity, action } = req.body;
    const { _id } = req.user;

    try {
        const user = await userModel.findById(_id.toString());
        let cart = await cartModel.findOne({ orderby: user._id });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Tìm sản phẩm trong giỏ hàng
        const productInCart = cart.products.find(
            (p) => p.product.toString() === productId
        );

        if (!productInCart) {
            return res
                .status(404)
                .json({ message: "Product not found in cart" });
        }

        // Cập nhật số lượng sản phẩm dựa vào hành động (tăng hoặc giảm)
        if (action === "increase") {
            productInCart.count += quantity;
        } else if (action === "decrease") {
            if (productInCart.count > quantity) {
                productInCart.count -= quantity;
            } else {
                // Nếu số lượng muốn giảm lớn hơn số lượng hiện có, xóa sản phẩm khỏi giỏ hàng
                cart.products = cart.products.filter(
                    (p) => p.product.toString() !== productId
                );
            }
        }

        // Tính lại tổng giá tiền của giỏ hàng
        let cartTotal = 0;
        for (let i = 0; i < cart.products.length; i++) {
            cartTotal += cart.products[i].price * cart.products[i].count;
        }
        cart.cartTotal = cartTotal;

        // Lưu lại giỏ hàng đã cập nhật
        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

/**
 *  ROUTER GET CART USER
 *
 */

const getUserCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    try {
        const cart = await cartModel
            .findOne({ orderby: _id })
            .populate("products.product");
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

const emptyCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    try {
        // Tìm người dùng dựa trên _id
        const user = await userModel.findOne({ _id });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Xoá tất cả các giỏ hàng của người dùng
        const cart = await cartModel.deleteMany({ orderby: user._id });

        res.json({ message: "Cart emptied successfully", cart: cart });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

const deleteCartItem = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { id } = req.params;

    try {
        const user = await userModel.findOne({ _id });
        let cart = await cartModel.findOne({ orderby: user._id });

        // Tìm index của sản phẩm cần xoá trong mảng products
        console.log(cart.products.length);
        if (cart.products.length === 1) {
            await cartModel.findOneAndDelete({ orderby: user._id });
            cart = null; // Đặt giỏ hàng thành null sau khi đã xoá
        } else {
            cart.products = cart.products.filter(
                (product) => product.product.toString() !== id
            );
            cart.cartTotal = cart.products.reduce(
                (total, product) => total + product.price * product.count,
                0
            );
            await cart.save(); // Lưu lại giỏ hàng sau khi đã xoá sản phẩm
        }

        // Nếu giỏ hàng không tồn tại, trả về thông báo rỗng
        if (!cart) {
            return res.json({ message: "Cart is empty" });
        }

        // Tạo một đối tượng mới chỉ chứa những thông tin cần thiết để trả về
        const responseCart = {
            _id: cart._id,
            products: cart.products,
            cartTotal: cart.cartTotal,
        };

        res.json(responseCart);
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

const applyCoupon = asyncHandler(async (req, res) => {
    const { coupon } = req.body;
    const { _id } = req.user;

    const validCoupon = await couponModel.findOne({ name: coupon });
    if (validCoupon === null) {
        throw new Error("Mã không đúng");
    }
    const user = await userModel.findOne({ _id });
    let { cartTotal } = await cartModel
        .findOne({
            orderby: user._id,
        })
        .populate("products.product");
    let totalAfterDiscount = (
        cartTotal -
        (cartTotal * validCoupon.discount) / 100
    ).toFixed(0);
    await Cart.findOneAndUpdate(
        { orderby: user._id },
        { totalAfterDiscount },
        { new: true }
    );
    res.json(totalAfterDiscount);
});

const createOrder = asyncHandler(async (req, res) => {
    const { COD, couponApplied, paymentMethod } = req.body;
    const { _id } = req.user;

    try {
        if (!COD) throw new Error("Create cash order failed");

        // Lấy giỏ hàng của người dùng
        const userCart = await cartModel.findOne({ orderby: _id });

        // Kiểm tra nếu giỏ hàng không tồn tại
        if (!userCart) throw new Error("User cart not found");

        // Lấy thông tin chi tiết của từng sản phẩm trong giỏ hàng
        const productDetails = await Promise.all(
            userCart.products.map(async (item) => {
                console.log(item.product);
                const product = await productModel
                    .findById(item.product)
                    .select("-__v -description");
                return {
                    product: product,
                    count: item.count,
                    _id: item._id,
                };
            })
        );

        // Tính tổng số tiền
        let finalAmount = 0;
        if (couponApplied && userCart.totalAfterDiscount) {
            finalAmount = userCart.totalAfterDiscount;
        } else {
            finalAmount = userCart.cartTotal;
        }
        // Lấy địa chỉ mặc định của người dùng
        let defaultAddress = await addressModel.findOne({
            user: _id,
            isDefault: true,
        });
        // Nếu không có địa chỉ nào được đặt là isDefault, chọn địa chỉ đầu tiên
        if (!defaultAddress) {
            defaultAddress = await addressModel.findOne({ user: _id });
        }

        if (!defaultAddress) {
            throw new Error("Default address not found");
        }
        // Tạo đơn hàng
        const newOrder = await new orderModel({
            products: productDetails,
            paymentIntent: {
                id: uniqid(),
                method: "COD",
                amount: finalAmount,
                status: "Chờ xử lý",
                created: Date.now(),
                currency: "vnđ",
            },
            orderDetails: defaultAddress,
            orderby: _id,
            paymentMethod: paymentMethod,
            orderStatus: "Chờ xử lý",
        }).save();

        // Cập nhật số lượng sản phẩm bán ra và số lượng tồn kho
        const update = userCart.products.map((item) => {
            return {
                updateOne: {
                    filter: { _id: item.product },
                    update: {
                        $inc: { quantity: -item.count, sold: +item.count },
                    },
                },
            };
        });

        const updated = await productModel.bulkWrite(update, {});

        res.json({ message: "success", success: true, newOrder });
    } catch (error) {
        res.json(error.message);
    }
});

const createOrderNotUser = asyncHandler(async (req, res) => {
    const {
        COD,
        couponApplied,
        orderDetails,
        products,
        paymentMethod,
        cartTotal,
    } = req.body;

    try {
        if (!COD) throw new Error("Create cash order failed");
        console.log(products.products);
        // Lấy thông tin chi tiết của từng sản phẩm trong mảng products
        const productDetails = await Promise.all(
            products.products.map(async (item) => {
                const product = await productModel
                    .findById(item.product._id)
                    .select("-__v -description");
                return {
                    product: product,
                    count: item.count,
                    _id: item._id,
                };
            })
        );

        // Tính tổng số tiền
        let finalAmount = 0;
        if (couponApplied) {
            // Tính tổng số tiền sau khi áp dụng mã giảm giá
            // Đây là ví dụ, bạn có thể sửa logic tính toán tùy theo yêu cầu cụ thể
            finalAmount = productDetails.reduce(
                (total, product) => total + product.price * product.count,
                0
            );
        } else {
            // Tính tổng số tiền nếu không áp dụng mã giảm giá
            finalAmount = productDetails.reduce(
                (total, product) => total + product.price * product.count,
                0
            );
        }

        // Tạo đơn hàng
        const newOrder = await new orderModel({
            products: productDetails,
            paymentIntent: {
                id: uniqid(),
                method: "COD",
                amount: cartTotal,
                status: "Chờ xử lý",
                created: Date.now(),
                currency: "vnđ",
            },
            paymentMethod: paymentMethod,
            orderStatus: "Chờ xử lý",
            orderDetails: orderDetails,
        }).save();

        // Cập nhật số lượng sản phẩm bán ra và số lượng tồn kho
        const update = products.products.map((item) => {
            return {
                updateOne: {
                    filter: { _id: item._id },
                    update: {
                        $inc: { quantity: -item.count, sold: +item.count },
                    },
                },
            };
        });

        const updated = await productModel.bulkWrite(update, {});

        res.json({ message: "success", success: true, newOrder });
    } catch (error) {
        res.json(error.message);
    }
});

const getOrders = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    try {
        const userorders = await orderModel
            .find({ orderby: _id })
            .sort({ createdAt: -1 })
            .populate("products.product")
            .populate({
                path: "orderby",
                select: "-password -role -refreshToken", // Loại bỏ trường password từ user
            })
            .exec();
        res.json(userorders);
    } catch (error) {
        res.json(error.message);
    }
});

const getAllOrders = asyncHandler(async (req, res) => {
    try {
        const alluserorders = await orderModel
            .find()
            .sort({ createdAt: -1 })
            .populate("products.product")
            .populate("orderby")
            .exec();
        if (!alluserorders) {
            return res.json({ success: false });
        }
        return res.json({ success: true, alluserorders: alluserorders });
    } catch (error) {
        throw new Error(error);
    }
});

const getOrderByUserId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        const userorders = await orderModel.findById(id);

        res.json({ success: true, ordersDetail: userorders });
    } catch (error) {
        throw new Error(error);
    }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderStatus } = req.body;
    const { id } = req.params;
    const { _id } = req.user;
    try {
        const updateOrderStatus = await orderModel.findByIdAndUpdate(
            id,
            {
                orderStatus: orderStatus,
            },
            { new: true }
        );

        res.json(updateOrderStatus);
    } catch (error) {
        throw new Error(error);
    }
});

const createAddress = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    req.body.user = _id;
    try {
        const newAddress = await addressModel.create(req.body);
        if (!newAddress) {
            return res
                .status(400)
                .json({ success: false, message: "Thêm địa chỉ thất bại" });
        }
        return res.json({
            success: true,
            message: "Thêm thành công",
            address: newAddress,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error: " + error.message });
    }
});

const getAddress = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    try {
        const addresses = await addressModel
            .find({ user: _id })
            .sort({ isDefault: -1 });
        if (!addresses || addresses.length === 0) {
            return res.json({
                success: false,
                message: "Bạn chưa có địa chỉ nào",
            });
        }
        return res.json({
            success: true,
            message: "Tất cả địa chỉ của bạn",
            addresses: addresses,
        });
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Lỗi server: " + error.message });
    }
});

const getAddressById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const getOneAddress = await addressModel.findById(id);
        if (!getOneAddress) {
            return res.json({
                success: false,
                message: "Địa chỉ không tồn tại",
            });
        }
        return res.json({
            success: true,
            message: "Địa chỉ của bạn",
            addresses: getOneAddress,
        });
    } catch (error) {}
});

const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        // Lấy địa chỉ cần cập nhật
        const addressToUpdate = await addressModel.findById(id);

        if (!addressToUpdate) {
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy địa chỉ" });
        }

        // Nếu isDefault được cập nhật
        if (req.body.isDefault === true) {
            // Tìm và cập nhật tất cả các địa chỉ khác của người dùng thành isDefault = false
            await addressModel.updateMany(
                { user: addressToUpdate.user, _id: { $ne: id } }, // Tất cả địa chỉ của người dùng ngoại trừ địa chỉ cần cập nhật
                { $set: { isDefault: false } }
            );
        }

        // Cập nhật địa chỉ
        const updatedAddress = await addressModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true }
        );

        return res.json({
            success: true,
            message: "Cập nhật thành công",
            addresses: updatedAddress,
        });
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Lỗi server: " + error.message });
    }
});

const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const deleteadress = await addressModel.findByIdAndDelete(id);
        if (!deleteadress)
            return res.json({
                success: false,
                message: "Xoá thất bại",
            });
        return res.json({
            success: true,
            message: "Xoá thành công",
            addresses: deleteadress,
        });
    } catch (error) {}
});

module.exports = {
    createUser,
    loginUser,
    loginAdmin,
    logoutUser,
    updateUser,
    deleteUser,
    getOneUser,
    getAllUser,
    userCart,
    userUpdateCart,
    getUserCart,
    emptyCart,
    deleteCartItem,
    applyCoupon,
    createOrder,
    createOrderNotUser,
    getOrders,
    getAllOrders,
    getOrderByUserId,
    updateOrderStatus,
    createAddress,
    getAddress,
    getAddressById,
    updateAddress,
    deleteAddress,
};
