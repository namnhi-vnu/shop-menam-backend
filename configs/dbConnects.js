const mongoose = require("mongoose");

const DbConnect = async () => {
    try {
        await mongoose.connect(process.env.DBCONNECT_URL);
        console.log("Connected Successfully");
    } catch (error) {
        console.log("NOT Connected");
    }
};

module.exports = DbConnect;
