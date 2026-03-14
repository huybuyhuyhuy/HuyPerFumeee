-- Tạo database
CREATE DATABASE IF NOT EXISTS huyperfume CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE huyperfume;

-- Bảng categories
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Bảng brand
CREATE TABLE IF NOT EXISTS brand (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    address TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DOUBLE NOT NULL,
    image VARCHAR(500),
    status BOOLEAN DEFAULT TRUE,
    id_category INT,
    id_brand INT,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_category) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (id_brand) REFERENCES brand(id) ON DELETE SET NULL
);

-- Bảng orders
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total DOUBLE NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng order_items
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DOUBLE NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Thêm dữ liệu mẫu cho categories
INSERT INTO categories (name) VALUES 
('Nước hoa nam'),
('Nước hoa nữ'),
('Nước hoa unisex');

-- Thêm dữ liệu mẫu cho brand
INSERT INTO brand (name) VALUES 
('Chanel'),
('Dior'),
('Gucci'),
('Versace'),
('Calvin Klein');

-- Thêm admin user (password: admin123 - đã hash MD5)
INSERT INTO users (name, email, phone, password, address, role) VALUES 
('Admin', 'admin@huyperfume.com', '0123456789', '0192023a7bbd73250516f069df18b500', 'Hà Nội', 'admin');

-- Thêm dữ liệu mẫu cho products
INSERT INTO products (name, price, image, status, id_category, id_brand, stock) VALUES 
('Chanel No.5', 2500000, '1.png', TRUE, 2, 1, 50),
('Dior Sauvage', 2800000, '2.png', TRUE, 1, 2, 30),
('Gucci Bloom', 2300000, '3.png', TRUE, 2, 3, 40);
