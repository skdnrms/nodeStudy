const express = require('express');
const path = require('path');
const app = express();

app.use('/se', express.static(path.join(__dirname, 'lib', 'synapeditor')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(8080, () => {
    console.log('editor-server start')
});