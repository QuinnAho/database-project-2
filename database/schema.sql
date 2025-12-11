-- Home Cleaning Service Database Schema

-- Drop existing database if exists and create new
DROP DATABASE IF EXISTS home_cleaning_service;
CREATE DATABASE home_cleaning_service;
USE home_cleaning_service;

-- CLIENTS TABLE
-- Stores client registration information
CREATE TABLE clients (
    client_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    credit_card_number VARCHAR(16),  -- Store encrypted in production
    credit_card_expiry VARCHAR(7),   -- Format: MM/YYYY
    credit_card_cvv VARCHAR(4),      -- Store encrypted in production
    password VARCHAR(255) NOT NULL,   -- Hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SERVICE REQUESTS TABLE
-- Stores client service requests
CREATE TABLE service_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    service_address VARCHAR(255) NOT NULL,
    cleaning_type ENUM('basic', 'deep cleaning', 'move-out', 'other') NOT NULL,
    number_of_rooms INT NOT NULL CHECK (number_of_rooms > 0),
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    proposed_budget DECIMAL(10, 2) NOT NULL CHECK (proposed_budget > 0),
    special_notes TEXT,
    rejection_reason TEXT,
    status ENUM('pending', 'quoted', 'negotiating', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PHOTOS TABLE
-- Stores photos uploaded with service requests
-- Up to 5 photos per request
CREATE TABLE photos (
    photo_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    upload_order TINYINT NOT NULL CHECK (upload_order BETWEEN 1 AND 5),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(request_id) ON DELETE CASCADE,
    INDEX idx_request (request_id),
    UNIQUE KEY unique_request_order (request_id, upload_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- QUOTES TABLE
-- Anna's quote responses to service requests
CREATE TABLE quotes (
    quote_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    quoted_price DECIMAL(10, 2) NOT NULL CHECK (quoted_price > 0),
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME NOT NULL,
    notes TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'countered') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(request_id) ON DELETE CASCADE,
    INDEX idx_request (request_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- QUOTE NEGOTIATIONS TABLE
-- Tracks back-and-forth negotiation on quotes
CREATE TABLE quote_negotiations (
    negotiation_id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL,
    sender_type ENUM('client', 'contractor') NOT NULL,
    message TEXT NOT NULL,
    proposed_price DECIMAL(10, 2),
    proposed_date DATE,
    proposed_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE CASCADE,
    INDEX idx_quote (quote_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ORDERS TABLE
-- Generated when quote is accepted
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id INT NOT NULL UNIQUE,
    request_id INT NOT NULL,
    client_id INT NOT NULL,
    final_price DECIMAL(10, 2) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    completion_notes TEXT,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE RESTRICT,
    FOREIGN KEY (request_id) REFERENCES service_requests(request_id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE RESTRICT,
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_date (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BILLS TABLE
-- Generated after order completion
CREATE TABLE bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    client_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    discount DECIMAL(10, 2) DEFAULT 0.00 CHECK (discount >= 0),
    final_amount DECIMAL(10, 2) GENERATED ALWAYS AS (amount - discount) STORED,
    status ENUM('pending', 'paid', 'disputed', 'revised') DEFAULT 'pending',
    due_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE RESTRICT,
    INDEX idx_client (client_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- BILL NEGOTIATIONS TABLE
-- Tracks disputes and revisions on bills
CREATE TABLE bill_negotiations (
    negotiation_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    sender_type ENUM('client', 'contractor') NOT NULL,
    message TEXT NOT NULL,
    proposed_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE,
    INDEX idx_bill (bill_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PAYMENTS TABLE
-- Records all payment transactions
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    client_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid > 0),
    payment_method ENUM('credit_card', 'debit_card', 'cash', 'other') DEFAULT 'credit_card',
    transaction_id VARCHAR(100),
    payment_status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE RESTRICT,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE RESTRICT,
    INDEX idx_bill (bill_id),
    INDEX idx_client (client_id),
    INDEX idx_paid_at (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ADMIN USERS TABLE (for Anna/Contractor)
CREATE TABLE admin_users (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role ENUM('admin', 'contractor') DEFAULT 'contractor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TRIGGERS
-- Trigger: Update service_request status when quote is created
DELIMITER $$
CREATE TRIGGER after_quote_insert
AFTER INSERT ON quotes
FOR EACH ROW
BEGIN
    UPDATE service_requests
    SET status = 'quoted'
    WHERE request_id = NEW.request_id;
END$$
DELIMITER ;

-- Trigger: Update bill due_date to 7 days from creation if not specified
DELIMITER $$
CREATE TRIGGER before_bill_insert
BEFORE INSERT ON bills
FOR EACH ROW
BEGIN
    IF NEW.due_date IS NULL THEN
        SET NEW.due_date = DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY);
    END IF;
END$$
DELIMITER ;

-- SAMPLE DATA (for testing)

-- Insert admin user (Anna Johnson)
-- Password: 'password' (hashed with bcrypt)
INSERT INTO admin_users (username, email, password, full_name, role)
VALUES ('anna', 'anna@cleaning.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye/PmVxPZLfXqVH5eJqVqHhNz1p/xU7a2', 'Anna Johnson', 'admin');

-- Insert sample client
INSERT INTO clients (first_name, last_name, email, phone, address, password)
VALUES
('John', 'Doe', 'john.doe@email.com', '555-0101', '123 Main St, Anytown, ST 12345', '$2b$10$samplehash123'),
('Jane', 'Smith', 'jane.smith@email.com', '555-0102', '456 Oak Ave, Somewhere, ST 67890', '$2b$10$samplehash456'),
('Bob', 'Wilson', 'bob.wilson@email.com', '555-0103', '789 Pine Rd, Elsewhere, ST 11111', '$2b$10$samplehash789');
