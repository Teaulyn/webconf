// app.js

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/user');
const File = require('./models/file');
const PORT = process.env.PORT || 3000;

const app = express();

// 连接数据库
mongoose.connect('mongodb://localhost/web_disk', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to database'))
    .catch(err => console.error('Database connection error:', err));

// 设置文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 用户认证路由
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.json({ message: '注册成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !await user.isValidPassword(password)) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }
        res.json({ message: '登录成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 文件上传路由
app.post('/api/file/upload', upload.single('file'), async (req, res) => {
    try {
        const file = new File({
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path
        });
        await file.save();
        res.json({ message: '文件上传成功', filename: req.file.filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 文件列表路由
app.get('/api/file/list', async (req, res) => {
    try {
        const files = await File.find();
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 文件下载路由
app.get('/api/file/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    res.download(filePath);
});

// 文件删除路由
app.delete('/api/file/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await File.findByIdAndDelete(id);
        res.json({ message: '文件删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 静态文件目录
app.use(express.static('public'));

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
