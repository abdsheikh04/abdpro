const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '10mb' })); // to handle large image data

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Function to upload image to S3
const uploadImageToS3 = (buffer, fileName) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: 'image/png',
            ACL: 'public-read' // Make the file publicly accessible
        };
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};

// Route for uploading the image
app.post('/upload', async (req, res) => {
    try {
        const imageData = req.body.image.replace(/^data:image\/\w+;base64,/, ''); // Strip image metadata
        const buffer = Buffer.from(imageData, 'base64'); // Convert base64 to buffer

        const fileName = `image-${Date.now()}.png`; // Generate unique file name

        // Upload to S3
        const fileUrl = await uploadImageToS3(buffer, fileName);

        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error("Error uploading the image:", error);
        res.status(500).json({ success: false, message: "Error uploading image" });
    }
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

