var AWS = require('aws-sdk');
var fs = require('fs');
require('dotenv').config({path: __dirname + '/' + '.env'});
 
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region : 'ap-northeast-2'
});
console.log(process.env.AWS_ACCESS_KEY);
console.log(process.env.AWS_SECRET_ACCESS_KEY);

var tar = '26309675.jpg';
var param = {
    'Bucket':'firsttest-s3.com',
    'Key': 'images/' + tar,
    'ACL':'public-read',
    'Body':fs.createReadStream(tar),
}
 
s3.upload(param, function(err, data){
    if(err) {
        console.log('Error!');
        console.log(err);
    }
    else{
        console.log("Done");
        console.log(data);
    }
});