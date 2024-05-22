const express = require('express');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();

// Configure express-session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

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

// Middleware to parse JSON data
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'pdfFile') {
            cb(null, path.join(__dirname, 'client', 'uploads'));
        } else if (file.fieldname === 'thumbnail') {
            cb(null, path.join(__dirname, 'client', 'uploads', 'thumbnails'));
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Route to render Sign in 
app.get("/logIn", (req, res) => {
    res.render("signIn");
})

// Route to render sign up
app.get("/register", (req, res) => {
    res.render("signUp");
})

// Route to render home.ejs
app.get('/', (req, res) => {
    const category = req.query.category;
    let sql = 'SELECT * FROM pdfs';
    let queryParams = [];

    if (category) {
        sql += ' WHERE category = ?';
        queryParams.push(category);
    }

    db.query(sql, queryParams, (err, pdfResults) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        if (req.session.loggedInUserId) {
            const userId = req.session.loggedInUserId;
            const likeSql = 'SELECT pdf_id FROM user_pdf_liked WHERE user_id = ?';
            const saveSql = 'SELECT pdf_id FROM user_pdf_saved WHERE user_id = ?';

            db.query(likeSql, [userId], (err, likeResults) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Database error');
                    return;
                }

                db.query(saveSql, [userId], (err, saveResults) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Database error');
                        return;
                    }

                    const likedPdfs = likeResults.map(row => row.pdf_id);
                    const savedPdfs = saveResults.map(row => row.pdf_id);

                    res.render('home', { pdfs: pdfResults, loggedIn: true, likedPdfs, savedPdfs });
                });
            });
        } else {
            res.render('home', { pdfs: pdfResults, loggedIn: false, likedPdfs: [], savedPdfs: [] });
        }
    });
});

// Middleware for checking authentication
function requireLogin(req, res, next) {
    if (req.session.loggedInUserId) {
        next(); // User is logged in, proceed to the next middleware
    } else {
        res.status(401).send('Unauthorized'); // User is not logged in, send 401 Unauthorized status
    }
}

// Route to handle file uploads
app.post('/upload', requireLogin, upload.fields([{ name: 'pdfFile', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
    const { fileName, category } = req.body;
    const pdfFilePath = req.files['pdfFile'] ? path.join('uploads', req.files['pdfFile'][0].filename) : null;
    const thumbnailFilePath = req.files['thumbnail'] ? path.join('uploads', 'thumbnails', req.files['thumbnail'][0].filename) : null;
    const addedBy = req.session.username; // Use the username stored in the session
    const likeCount = 0;

    const sql = `INSERT INTO pdfs (fileName, filepath, thumbnailPath, addedBy, likeCount, category) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [fileName, pdfFilePath, thumbnailFilePath, addedBy, likeCount, category], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.redirect('/');
        }
    });
});

// Route to handle user registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        // If username already exists, redirect back to the registration page with an error message
        if (results.length > 0) {
            res.redirect('/register?error=username_taken');
            return;
        }

        // If username doesn't exist, insert the new user into the users table
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send('Database error');
            } else {
                // Redirect the user to the login page after successful registration
                res.redirect('/logIn');
            }
        });
    });
});

// Route to handle user login
app.post('/signIn', (req, res) => {
    const { username, password } = req.body;

    // Check if the username and password are correct
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        // If no user found with the provided credentials, redirect back to the login page with an error message
        if (results.length === 0) {
            res.redirect('/logIn?error=invalid_credentials');
            return;
        }

        // If user found, set the loggedInUser property in the session
        req.session.loggedInUserId = results[0].id; // Assuming the ID is in the first result
        req.session.username = results[0].username; // Store the username in the session

        // Redirect the user to the home page after successful login
        res.redirect('/');
    });
});

// Route to handle liking a PDF
app.post('/like', requireLogin, (req, res) => {
    const { pdfId } = req.body;
    const userId = req.session.loggedInUserId; // Assuming you store the user ID in the session

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    // Check if the user has already liked this PDF
    const checkSql = `SELECT * FROM user_pdf_liked WHERE user_id = ? AND pdf_id = ?`;
    db.query(checkSql, [userId, pdfId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        if (results.length > 0) {
            res.send('Already Liked');
            return;
        }

        const sql = `INSERT INTO user_pdf_liked (user_id, pdf_id) VALUES (?, ?)`;
        db.query(sql, [userId, pdfId], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send('Database error');
            } else {
                // Update the like count
                const updateSql = `UPDATE pdfs SET likeCount = likeCount + 1 WHERE id = ?`;
                db.query(updateSql, [pdfId], (err, updateResult) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Database error');
                        return;
                    }

                    res.send('Liked');
                });
            }
        });
    });
});

// Route to handle saving a PDF
app.post('/save', requireLogin, (req, res) => {
    const { pdfId } = req.body;
    const userId = req.session.loggedInUserId; // Assuming you store the user ID in the session

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    // Check if the user has already saved this PDF
    const checkSql = `SELECT * FROM user_pdf_saved WHERE user_id = ? AND pdf_id = ?`;
    db.query(checkSql, [userId, pdfId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        if (results.length > 0) {
            res.send('Already Saved');
            return;
        }

        const sql = `INSERT INTO user_pdf_saved (user_id, pdf_id) VALUES (?, ?)`;
    db.query(sql, [userId, pdfId], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).send('Database error');
            } else {
                res.send('Saved');
            }
        });
    });
});

// Route to handle unliking a PDF
app.post('/unlike', requireLogin, (req, res) => {
    const { pdfId } = req.body;
    const userId = req.session.loggedInUserId; // Assuming you store the user ID in the session

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    const sql = `DELETE FROM user_pdf_liked WHERE user_id = ? AND pdf_id = ?`;
    db.query(sql, [userId, pdfId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            // Update the like count
            const updateSql = `UPDATE pdfs SET likeCount = likeCount - 1 WHERE id = ?`;
            db.query(updateSql, [pdfId], (err, updateResult) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Database error');
                    return;
                }

                res.send('Unliked');
            });
        }
    });
});

// Route to handle unsaving a PDF
app.post('/unsave', requireLogin, (req, res) => {
    const { pdfId } = req.body;
    const userId = req.session.loggedInUserId; // Assuming you store the user ID in the session

    if (!userId) {
        return res.status(401).send('User not logged in');
    }

    const sql = `DELETE FROM user_pdf_saved WHERE user_id = ? AND pdf_id = ?`;
    db.query(sql, [userId, pdfId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
        } else {
            res.send('Unsaved');
        }
    });
});

// Route to handle user account
app.get('/userAccount', requireLogin, (req, res) => {
    const userId = req.session.loggedInUserId;
    const username = req.session.username;

    const likedSql = `
        SELECT p.* 
        FROM pdfs p 
        JOIN user_pdf_liked upl ON p.id = upl.pdf_id 
        WHERE upl.user_id = ?
    `;

    const savedSql = `
        SELECT p.* 
        FROM pdfs p 
        JOIN user_pdf_saved ups ON p.id = ups.pdf_id 
        WHERE ups.user_id = ?
    `;

    db.query(likedSql, [userId], (err, likedResults) => {
        if (err) {
            console.error(err);
            res.status(500).send('Database error');
            return;
        }

        db.query(savedSql, [userId], (err, savedResults) => {
            if (err) {
                console.error(err);
                res.status(500).send('Database error');
                return;
            }

            res.render('userAccount', {
                username: username,
                likedPdfs: likedResults,
                savedPdfs: savedResults
            });
        });
    });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
