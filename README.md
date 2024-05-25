# How to set up process  

type this code  

```git clone https://github.com/subhamchowdhury7777/find-MY-NOTEs.git```

cd to find-MY-NOTEs  
```cd find-MY-NOTEs```

then type  
```npm install``   
this will install the required module automatically  

then to run this project you will need mysql install on your machine 
so download this from here
[Dowbload from here](https://dev.mysql.com/downloads/installer/)  

and run this query on my sql  
```
    -- Create the database
CREATE DATABASE pdf_website;

-- Use the database
USE pdf_website;

-- Create the users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Create the pdfs table
CREATE TABLE pdfs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    filepath VARCHAR(255) NOT NULL,
    thumbnailPath VARCHAR(255),
    addedBy VARCHAR(100),
    likeCount INT DEFAULT 0,
    category VARCHAR(100)
);

-- Create the user_pdf_liked table
CREATE TABLE user_pdf_liked (
    user_id INT,
    pdf_id INT,
    PRIMARY KEY (user_id, pdf_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pdf_id) REFERENCES pdfs(id)
);

-- Create the user_pdf_saved table
CREATE TABLE user_pdf_saved (
    user_id INT,
    pdf_id INT,
    PRIMARY KEY (user_id, pdf_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pdf_id) REFERENCES pdfs(id)
);

```
