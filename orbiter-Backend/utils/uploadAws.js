const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { bucketName, s3Client, s3Url } = require("./awsConfig");
const multer = require("multer");

const uploadToS3 = async (file, folder, contentType, uploadingFolder) => {
  const filePath = `${path.join(__dirname, `../upload/${folder}`)}/${
    file.filename
  }`;
  try {
    console.time("uploading")
    const uploadHere = uploadingFolder || folder;
    const key = `${uploadHere}/${file.filename}`;
    const fileBuffer = fs.readFileSync(filePath);

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ACL: "public-read",
      ContentType: contentType,
    };

    const result = await s3Client.send(new PutObjectCommand(params));
    console.log(`${file.fieldname} uploaded successfully:`, result);
    console.timeEnd("uploading")
    return `${s3Url}/${uploadHere}/${file.filename}`;
  } catch (error) {
    console.error(`Error uploading ${file.fieldname} to S3:`, err);
    console.timeEnd("uploading")
    throw err;
  }
};

const processAndUploadImage = async (file, folder, width, quality) => {
  const filePath = path.join(__dirname, `../upload/images`, file.filename);
  const key = `${folder}/${file.filename}`;
  const data = fs.readFileSync(filePath);

  try {
    console.time("uploading")
    const compressedData = await sharp(data)
      .resize({ width })
      .jpeg({ quality })
      .toBuffer();

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: compressedData,
      ACL: "public-read",
      ContentType: "image/jpeg",
    };
    

    const result = await s3Client.send(new PutObjectCommand(params));
    console.log(`${file.fieldname} uploaded successfully:`, result);
    console.timeEnd("uploading")
    return `${s3Url}/${folder}/${file.filename}`;
  } catch (err) {
    console.error(`Error uploading ${file.fieldname} to S3:`, err);
    console.timeEnd("uploading")
    throw err;
  }
};
function errHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    res.json({
      success: 0,
      message: err.message,
    });
  }
}

module.exports = { uploadToS3, processAndUploadImage, errHandler };
