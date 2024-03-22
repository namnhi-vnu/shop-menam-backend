const cloudinary = require("cloudinary").v2;
require("dotenv").config();
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const cloudinaryUploadImg = async (fileToUpload, folder) => {
    // console.log(process.env.API_KEY);
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            fileToUpload,
            {
                folder: folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        asset_id: result.asset_id,
                        public_id: result.public_id,
                    });
                }
            }
        );
    });
};

const cloudinaryDeleteImg = async (fileToDelete) => {
    return new Promise((resolve) => {
        cloudinary.uploader.destroy(fileToDelete, (result) => {
            resolve(
                {
                    url: result.secure_url,
                    asset_id: result.asset_id,
                    public_id: result.public_id,
                },
                {
                    resource_type: "auto",
                }
            );
        });
    });
};

module.exports = {
    cloudinaryUploadImg,
    cloudinaryDeleteImg,
};
