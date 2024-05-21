const express = require('express');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '#Boss2004',
    database: 'pdf_website'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Define the views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "client" directory
app.use(express.static(path.join(__dirname, 'client')));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'client', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Define a route to render home.ejs
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM pdfs';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.render('home', { pdfs: results });
        }
    });
});

// Route to handle file uploads
app.post('/upload', upload.single('pdfFile'), (req, res) => {
    const { fileName, category } = req.body;
    const filePath = path.join('uploads', req.file.filename); // Store relative path
    const thumbnailPath = 'path/to/thumbnail'; // You need to generate or upload thumbnail separately
    const addedBy = 'anonymous'; // This should be replaced with the actual user's name
    const likeCount = 0;

    const sql = `INSERT INTO pdfs (fileName, filepath, thumbnailPath, addedBy, likeCount, category) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [fileName, filePath, thumbnailPath, addedBy, likeCount, category], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.redirect('/');
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
