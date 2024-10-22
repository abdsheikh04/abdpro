const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '10mb' })); // to handle large image data

// AWS S3 Configuration using AWS SDK v3 with hardcoded credentials
const s3Client = new S3Client({
    region: 'ap-south-1', // specify your region here
    credentials: {
        accessKeyId: 'AKIA5WLTTDAAT2AJOWVH', // specify your AWS Access Key here
        secretAccessKey: 'bFn9OKtPpzw3YLXor1OR6nQG0M6KJO630zsLi7QW' // specify your AWS Secret Key here
    }
});

// Function to upload image to S3 using AWS SDK v3
const uploadImageToS3 = async (buffer, fileName) => {
    const params = {
        Bucket: 'proabdullah', // specify your S3 bucket name here
        Key: fileName,
        Body: buffer,
        ContentType: 'image/png',
        ACL: 'public-read' // Make the file publicly accessible
    };
    
    try {
        const data = await s3Client.send(new PutObjectCommand(params));
        const fileUrl = `https://${params.Bucket}.s3.${s3Client.config.region}.amazonaws.com/${params.Key}`;
        return fileUrl;
    } catch (err) {
        console.error('Error uploading the image to S3:', err);
        throw err;
    }
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

// Serve index.html from the same folder as this script
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serving index.html from the current directory
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
