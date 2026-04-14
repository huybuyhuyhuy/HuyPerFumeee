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
    name VARCHAR(255) NOT NULL,
    status BOOLEAN DEFAULT TRUE
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
    description TEXT,
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
    shipping_address TEXT,
    phone VARCHAR(20),
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

-- Bảng wishlist
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ==========================================================
-- MIGRATION: đồng bộ schema cho DB cũ (nếu đã tạo trước đó)
-- ==========================================================
ALTER TABLE brand ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- ==========================================================
-- INDEX tối ưu truy vấn thường dùng
-- ==========================================================
SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_category'
    ),
    'SELECT 1',
    'CREATE INDEX idx_products_category ON products(id_category)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_brand'
    ),
    'SELECT 1',
    'CREATE INDEX idx_products_brand ON products(id_brand)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_user'
    ),
    'SELECT 1',
    'CREATE INDEX idx_orders_user ON orders(user_id)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_email'
    ),
    'SELECT 1',
    'CREATE INDEX idx_users_email ON users(email)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_phone'
    ),
    'SELECT 1',
    'CREATE INDEX idx_users_phone ON users(phone)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Thêm dữ liệu mẫu cho categories
INSERT INTO categories (name) VALUES 
('Nước hoa nam'),
('Nước hoa nữ'),
('Nước hoa unisex');

-- Thêm dữ liệu mẫu cho brand
INSERT INTO brand (name, status) VALUES
('Chanel', TRUE),
('Dior', TRUE),
('Gucci', TRUE),
('Versace', TRUE),
('Calvin Klein', TRUE);

-- Thêm admin user (password: admin123 - đã hash MD5)
INSERT INTO users (name, email, phone, password, address, role) VALUES 
('Admin', 'admin@huyperfume.com', '0123456789', '0192023a7bbd73250516f069df18b500', 'Hà Nội', 'admin');

-- Thêm dữ liệu mẫu cho products
INSERT INTO products (name, price, image, description, status, id_category, id_brand, stock) VALUES
('Chanel No.5', 2500000, '1.png', 'Mùi hương biểu tượng cổ điển, sang trọng và nữ tính.', TRUE, 2, 1, 50),
('Dior Sauvage', 2800000, '2.png', 'Hương thơm nam tính hiện đại, tươi mát và mạnh mẽ.', TRUE, 1, 2, 30),
('Gucci Bloom', 2300000, '3.png', 'Mùi hương hoa cỏ thanh lịch, phù hợp dùng hằng ngày.', TRUE, 2, 3, 40);
