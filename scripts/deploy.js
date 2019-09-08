const AWS = require('aws-sdk');
const s3 = new AWS.S3();
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

glob('./build/**/*', {}, (err, files) => {
    files.forEach(file => {
        if (!fs.lstatSync(file).isDirectory()) {
            const fileContents = fs.readFileSync(`./${file}`);
            const fileMime = mimeTypes.lookup(file);

            s3.upload(
                {
                    Bucket: 'notate-app',
                    Key: file.replace('./public/', ''),
                    Body: fileContents,
                    ContentType: fileMime
                },
                {partSize: 10 * 1024 * 1024, queueSize: 1},
                (err, data) => {
                    if (err) {
                        console.log('process bits!!!!!!!!!!!!', process.env);
                        throw new Error(err.message);
                    }

                    console.log(data);
                }
            );
        }
    });
});