const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();
const fs = require('fs');
const glob = require('glob');
const mimeTypes = require('mime-types');
require('dotenv').config();

AWS.config = new AWS.Config({
    credentials: new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }),
    region: process.env.AWS_DEFAULT_REGION
});

const createCloudFrontInvalidation = () => new Promise((resolve, reject) => {
    const params = {
        DistributionId: process.env.AWS_CLOUDFRONT_DIST_ID,
        InvalidationBatch: {
            CallerReference: Date.now().toString(),
            Paths: { 
                Quantity: '1',
                Items: [
                    '/*',
                ]
            }
        }
    };

    cloudfront.createInvalidation(params,(err, data) => {
        if (err) reject(err);
        else {
            console.log('createInvalidation success!');
            resolve();
        }
    });
});

const uploadFilesToS3 = (files) => {
    return new Promise((resolve, reject) => {
        files.forEach(file => {
            if (!fs.lstatSync(file).isDirectory()) {
                const fileContents = fs.readFileSync(`./${file}`);
                const fileMime = mimeTypes.lookup(file);
    
                s3.upload(
                    {
                        Bucket: 'notate-app',
                        Key: file.replace('./build/', ''),
                        Body: fileContents,
                        ContentType: fileMime
                    },
                    {partSize: 10 * 1024 * 1024, queueSize: 1},
                    (err, data) => {
                        if (err) {
                            reject(err.message);
                        }
                    }
                );
            }
        });
        console.log('completed s3 push!');
        resolve();
    });
};

glob('./build/**/*', {}, async (err, files) => {
    await uploadFilesToS3(files);
    await createCloudFrontInvalidation();
});