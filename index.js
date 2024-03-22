const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const DbConnect = require("./configs/dbConnects");

DbConnect();

const app = express();
const PORT = process.env.PORT || 5000;

// Router
const authRoute = require("./routes/authRoute");
const couponRoute = require("./routes/couponRoute");
const productRoute = require("./routes/productRoute");
const productCategoryRoute = require("./routes/prdCategoryRoute");
const uploadRoute = require("./routes/uploadRoute");

app.use(morgan("dev"));
app.use(express.json());
app.use(cors());
app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(cookieParser());

/**
 *  API routes
 *
 */

app.use("/api/user", authRoute);
app.use("/api/product", productRoute);
app.use("/api/category", productCategoryRoute);
app.use("/api/coupon", couponRoute);
app.use("/api/upload", uploadRoute);

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
