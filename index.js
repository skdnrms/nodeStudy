const request = require('request');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzip = require('unzip');
const zlib = require('zlib');
const app = express();
const childProcess = require('child_process');
const port = 8787;

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, 'res')) // 콜백함수를 통해 전송된 파일 저장 디렉토리 설정
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname) // 콜백함수를 통해 전송된 파일 이름 설정
    }
});
const uploader = multer({ storage: storage })

app.use('/se', express.static(path.join(__dirname, 'lib')));
app.use('/res', express.static(path.join(__dirname, 'res')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`editor-server start at localhost:${port}`);
});

app.post('/uploadImage', uploader.single('imageFile'), (req, res) => {
    res.json({
        uploadPath: path.join('res', req.file.filename)
    });
});

app.post('/getSerializedPbData', uploader.single('docFile'), (req, res) => {
    const fileName = req.file.filename;
    let rs = fs.createReadStream(path.join(__dirname, 'res', fileName));
    let ws = fs.createWriteStream(path.join(__dirname, 'tmp', `${fileName}.zip`));
    request.post('http://synapeditor.iptime.org:8686/import', {
        formData: {
            file: rs
        }
    }).pipe(ws);

    ws.on('close', () => {
        let serializedData = [];
        const readStream = fs.createReadStream(path.join(__dirname, 'tmp', `${fileName}.zip`));
        readStream.pipe(unzip.Extract({path: path.join(__dirname, 'tmp')})).on('close', () => {
            fs.createReadStream(path.join(__dirname, 'tmp', 'document.word.pb'), {start: 16})
            .pipe(zlib.createUnzip())
            .on('data', (data) => {
                for (let i = 0, len = data.length; i < len; i++) {
                    serializedData.push(data[i] & 0xFF);
                }
            }).on('close', () => {
                res.json({serializedData: serializedData});
                res.end();
            });
        });
    });
});

app.get('/load', (req, res) => {
    request.get('http://localhost:8686/import2', {
        qs: {
            'url': 'https://calibre-ebook.com/downloads/demos/demo.docx'
        }
    });
});