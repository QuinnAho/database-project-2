-- Sample Data for Analytics Demo
-- Run this BEFORE the presentation to populate analytics

USE home_cleaning_service;

-- DEMO CLIENT (Simulates Presenter 1's registration)
INSERT INTO clients (first_name, last_name, email, phone, address, password, created_at) VALUES
('John', 'Smith', 'john.smith@demo.com', '555-1234', '789 Demo Street, Testville, ST 12345', '$2b$10$VXT/i/m2lHWni4HxmFXCfesUHG82FNgLufxEGtc5WsiaM6qHHBJd6', NOW());

-- Add more sample clients for analytics
INSERT INTO clients (first_name, last_name, email, phone, address, password, created_at) VALUES
('Sarah', 'Williams', 'sarah.w@email.com', '555-0201', '111 Maple St, Springfield, ST 22222', '$2b$10$samplehash001', DATE_SUB(NOW(), INTERVAL 60 DAY)),
('Mike', 'Davis', 'mike.d@email.com', '555-0202', '222 Oak Ave, Springfield, ST 33333', '$2b$10$samplehash002', DATE_SUB(NOW(), INTERVAL 45 DAY)),
('Emma', 'Brown', 'emma.b@email.com', '555-0203', '333 Pine Rd, Springfield, ST 44444', '$2b$10$samplehash003', DATE_SUB(NOW(), INTERVAL 30 DAY)),
('Tom', 'Garcia', 'tom.g@email.com', '555-0204', '444 Elm St, Springfield, ST 55555', '$2b$10$samplehash004', DATE_SUB(NOW(), INTERVAL 15 DAY)),
('Lisa', 'Martinez', 'lisa.m@email.com', '555-0205', '555 Birch Ln, Springfield, ST 66666', '$2b$10$samplehash005', DATE_SUB(NOW(), INTERVAL 90 DAY)),
('David', 'Lee', 'david.l@email.com', '555-0206', '666 Cedar Dr, Springfield, ST 77777', '$2b$10$samplehash006', DATE_SUB(NOW(), INTERVAL 120 DAY)),
('Amy', 'Taylor', 'amy.t@email.com', '555-0207', '777 Spruce Way, Springfield, ST 88888', '$2b$10$samplehash007', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('Chris', 'White', 'chris.w@email.com', '555-0208', '888 Willow Ct, Springfield, ST 99999', '$2b$10$samplehash008', NOW());

-- Get the client IDs (these will vary, so we use variables)
SET @demo_client = (SELECT client_id FROM clients WHERE email = 'john.smith@demo.com');
SET @sarah_id = (SELECT client_id FROM clients WHERE email = 'sarah.w@email.com');
SET @mike_id = (SELECT client_id FROM clients WHERE email = 'mike.d@email.com');
SET @emma_id = (SELECT client_id FROM clients WHERE email = 'emma.b@email.com');
SET @tom_id = (SELECT client_id FROM clients WHERE email = 'tom.g@email.com');
SET @lisa_id = (SELECT client_id FROM clients WHERE email = 'lisa.m@email.com');
SET @david_id = (SELECT client_id FROM clients WHERE email = 'david.l@email.com');
SET @amy_id = (SELECT client_id FROM clients WHERE email = 'amy.t@email.com');
SET @chris_id = (SELECT client_id FROM clients WHERE email = 'chris.w@email.com');

-- DEMO REQUEST (Simulates what Presenter 1 submitted)
INSERT INTO service_requests (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, special_notes, status, created_at) VALUES
(@demo_client, '789 Demo Street, Testville, ST 12345', 'deep cleaning', 4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00', 150, 'Please use pet-friendly products. We have two dogs.', 'pending', NOW());

SET @demo_request = (SELECT request_id FROM service_requests WHERE client_id = @demo_client LIMIT 1);

-- Add sample photos for demo request
INSERT INTO photos (request_id, photo_url, upload_order, uploaded_at) VALUES
(@demo_request, '/uploads/demo-living-room.jpg', 1, NOW()),
(@demo_request, '/uploads/demo-kitchen.jpg', 2, NOW()),
(@demo_request, '/uploads/demo-bathroom.jpg', 3, NOW());

-- Sarah: Frequent client (3 completed orders)
INSERT INTO service_requests (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, status, created_at) VALUES
(@sarah_id, '111 Maple St', 'basic', 3, DATE_ADD(CURDATE(), INTERVAL -50 DAY), '10:00', 100, 'accepted', DATE_SUB(NOW(), INTERVAL 55 DAY)),
(@sarah_id, '111 Maple St', 'deep cleaning', 3, DATE_ADD(CURDATE(), INTERVAL -30 DAY), '10:00', 150, 'accepted', DATE_SUB(NOW(), INTERVAL 35 DAY)),
(@sarah_id, '111 Maple St', 'basic', 3, DATE_ADD(CURDATE(), INTERVAL -10 DAY), '10:00', 100, 'accepted', DATE_SUB(NOW(), INTERVAL 15 DAY));

-- Mike: Frequent client (2 completed orders)
INSERT INTO service_requests (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, status, created_at) VALUES
(@mike_id, '222 Oak Ave', 'deep cleaning', 5, DATE_ADD(CURDATE(), INTERVAL -40 DAY), '14:00', 180, 'accepted', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(@mike_id, '222 Oak Ave', 'basic', 5, DATE_ADD(CURDATE(), INTERVAL -20 DAY), '14:00', 120, 'accepted', DATE_SUB(NOW(), INTERVAL 25 DAY));

-- Emma: Uncommitted client (3 requests, no orders)
INSERT INTO service_requests (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, status, created_at) VALUES
(@emma_id, '333 Pine Rd', 'basic', 2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:00', 80, 'rejected', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(@emma_id, '333 Pine Rd', 'basic', 2, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '09:00', 80, 'cancelled', DATE_SUB(NOW(), INTERVAL 20 DAY)),
(@emma_id, '333 Pine Rd', 'basic', 2, DATE_ADD(CURDATE(), INTERVAL 15 DAY), '09:00', 80, 'pending', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Tom: Uncommitted client (4 requests, no orders)
INSERT INTO service_requests (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, status, created_at) VALUES
(@tom_id, '444 Elm St', 'deep cleaning', 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00', 150, 'rejected', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(@tom_id, '444 Elm St', 'basic', 4, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00', 100, 'cancelled', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(@tom_id, '444 Elm St', 'basic', 4, DATE_ADD(CURDATE(), INTERVAL 8 DAY), '11:00', 100, 'rejected', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(@tom_id, '444 Elm St', 'basic', 4, DATE_ADD(CURDATE(), INTERVAL 12 DAY), '11:00', 100, 'pending', DATE_SUB(NOW(), INTERVAL 5 DAY));

-- Lisa: Largest job (10 rooms, completed)
INSERT INTO service_requests (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, status, created_at) VALUES
(@lisa_id, '555 Birch Ln (Large House)', 'move-out', 10, DATE_ADD(CURDATE(), INTERVAL -80 DAY), '08:00', 400, 'accepted', DATE_SUB(NOW(), INTERVAL 85 DAY));

-- David: Has accepted quote this month
INSERT INTO service_requests (client_id, service_address, cleaning_type, number_of_rooms, preferred_date, preferred_time, proposed_budget, status, created_at) VALUES
(@david_id, '666 Cedar Dr', 'basic', 4, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '13:00', 110, 'accepted', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Amy: Prospective client (registered but no requests)
-- No requests needed

-- Chris: Prospective client (registered today, no requests)
-- No requests needed

-- Now create quotes for accepted requests
SET @sarah_req1 = (SELECT request_id FROM service_requests WHERE client_id = @sarah_id ORDER BY created_at LIMIT 1);
SET @sarah_req2 = (SELECT request_id FROM service_requests WHERE client_id = @sarah_id ORDER BY created_at LIMIT 1 OFFSET 1);
SET @sarah_req3 = (SELECT request_id FROM service_requests WHERE client_id = @sarah_id ORDER BY created_at LIMIT 1 OFFSET 2);
SET @mike_req1 = (SELECT request_id FROM service_requests WHERE client_id = @mike_id ORDER BY created_at LIMIT 1);
SET @mike_req2 = (SELECT request_id FROM service_requests WHERE client_id = @mike_id ORDER BY created_at LIMIT 1 OFFSET 1);
SET @lisa_req = (SELECT request_id FROM service_requests WHERE client_id = @lisa_id LIMIT 1);
SET @david_req = (SELECT request_id FROM service_requests WHERE client_id = @david_id LIMIT 1);

INSERT INTO quotes (request_id, quoted_price, scheduled_date, scheduled_start_time, scheduled_end_time, notes, status, created_at) VALUES
(@sarah_req1, 110, DATE_ADD(CURDATE(), INTERVAL -50 DAY), '10:00', '13:00', 'Standard cleaning rate', 'accepted', DATE_SUB(NOW(), INTERVAL 54 DAY)),
(@sarah_req2, 170, DATE_ADD(CURDATE(), INTERVAL -30 DAY), '10:00', '14:00', 'Deep cleaning with carpet shampoo', 'accepted', DATE_SUB(NOW(), INTERVAL 34 DAY)),
(@sarah_req3, 110, DATE_ADD(CURDATE(), INTERVAL -10 DAY), '10:00', '13:00', 'Regular maintenance clean', 'accepted', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(@mike_req1, 200, DATE_ADD(CURDATE(), INTERVAL -40 DAY), '14:00', '18:00', 'Large home deep clean', 'accepted', DATE_SUB(NOW(), INTERVAL 44 DAY)),
(@mike_req2, 130, DATE_ADD(CURDATE(), INTERVAL -20 DAY), '14:00', '17:00', 'Routine cleaning', 'accepted', DATE_SUB(NOW(), INTERVAL 24 DAY)),
(@lisa_req, 450, DATE_ADD(CURDATE(), INTERVAL -80 DAY), '08:00', '17:00', 'Full move-out cleaning, 10 rooms', 'accepted', DATE_SUB(NOW(), INTERVAL 84 DAY)),
(@david_req, 120, DATE_ADD(CURDATE(), INTERVAL 10 DAY), '13:00', '16:00', 'Standard 4-room clean', 'accepted', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Create orders for completed services
SET @sarah_quote1 = (SELECT quote_id FROM quotes WHERE request_id = @sarah_req1);
SET @sarah_quote2 = (SELECT quote_id FROM quotes WHERE request_id = @sarah_req2);
SET @sarah_quote3 = (SELECT quote_id FROM quotes WHERE request_id = @sarah_req3);
SET @mike_quote1 = (SELECT quote_id FROM quotes WHERE request_id = @mike_req1);
SET @mike_quote2 = (SELECT quote_id FROM quotes WHERE request_id = @mike_req2);
SET @lisa_quote = (SELECT quote_id FROM quotes WHERE request_id = @lisa_req);

INSERT INTO orders (quote_id, request_id, client_id, final_price, scheduled_date, scheduled_start_time, scheduled_end_time, status, completed_at, created_at) VALUES
(@sarah_quote1, @sarah_req1, @sarah_id, 110, DATE_ADD(CURDATE(), INTERVAL -50 DAY), '10:00', '13:00', 'completed', DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 54 DAY)),
(@sarah_quote2, @sarah_req2, @sarah_id, 170, DATE_ADD(CURDATE(), INTERVAL -30 DAY), '10:00', '14:00', 'completed', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 34 DAY)),
(@sarah_quote3, @sarah_req3, @sarah_id, 110, DATE_ADD(CURDATE(), INTERVAL -10 DAY), '10:00', '13:00', 'completed', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY)),
(@mike_quote1, @mike_req1, @mike_id, 200, DATE_ADD(CURDATE(), INTERVAL -40 DAY), '14:00', '18:00', 'completed', DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 44 DAY)),
(@mike_quote2, @mike_req2, @mike_id, 130, DATE_ADD(CURDATE(), INTERVAL -20 DAY), '14:00', '17:00', 'completed', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 24 DAY)),
(@lisa_quote, @lisa_req, @lisa_id, 450, DATE_ADD(CURDATE(), INTERVAL -80 DAY), '08:00', '17:00', 'completed', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 84 DAY));

-- Create bills (some paid within 24h, some overdue, one bad client)
SET @sarah_order1 = (SELECT order_id FROM orders WHERE quote_id = @sarah_quote1);
SET @sarah_order2 = (SELECT order_id FROM orders WHERE quote_id = @sarah_quote2);
SET @sarah_order3 = (SELECT order_id FROM orders WHERE quote_id = @sarah_quote3);
SET @mike_order1 = (SELECT order_id FROM orders WHERE quote_id = @mike_quote1);
SET @mike_order2 = (SELECT order_id FROM orders WHERE quote_id = @mike_quote2);
SET @lisa_order = (SELECT order_id FROM orders WHERE quote_id = @lisa_quote);

-- Sarah: Good client (always pays within 24 hours)
INSERT INTO bills (order_id, client_id, amount, discount, status, due_date, created_at) VALUES
(@sarah_order1, @sarah_id, 110, 0, 'paid', DATE_SUB(NOW(), INTERVAL 43 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY)),
(@sarah_order2, @sarah_id, 170, 0, 'paid', DATE_SUB(NOW(), INTERVAL 23 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY)),
(@sarah_order3, @sarah_id, 110, 0, 'paid', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

-- Mike: Mixed (one overdue bill)
INSERT INTO bills (order_id, client_id, amount, discount, status, due_date, created_at) VALUES
(@mike_order1, @mike_id, 200, 0, 'paid', DATE_SUB(NOW(), INTERVAL 33 DAY), DATE_SUB(NOW(), INTERVAL 40 DAY)),
(@mike_order2, @mike_id, 130, 0, 'pending', DATE_SUB(NOW(), INTERVAL 28 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)); -- OVERDUE!

-- Lisa: Bad client (overdue, never paid)
INSERT INTO bills (order_id, client_id, amount, discount, status, due_date, created_at) VALUES
(@lisa_order, @lisa_id, 450, 0, 'pending', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 80 DAY)); -- VERY OVERDUE!

-- Create payments for paid bills (Sarah within 24h, Mike's first one after a few days)
SET @sarah_bill1 = (SELECT bill_id FROM bills WHERE order_id = @sarah_order1);
SET @sarah_bill2 = (SELECT bill_id FROM bills WHERE order_id = @sarah_order2);
SET @sarah_bill3 = (SELECT bill_id FROM bills WHERE order_id = @sarah_order3);
SET @mike_bill1 = (SELECT bill_id FROM bills WHERE order_id = @mike_order1);

INSERT INTO payments (bill_id, client_id, amount_paid, payment_method, payment_status, paid_at) VALUES
(@sarah_bill1, @sarah_id, 110, 'credit_card', 'completed', DATE_SUB(NOW(), INTERVAL 49.5 DAY)), -- 12 hours later
(@sarah_bill2, @sarah_id, 170, 'credit_card', 'completed', DATE_SUB(NOW(), INTERVAL 29.8 DAY)), -- 5 hours later
(@sarah_bill3, @sarah_id, 110, 'credit_card', 'completed', DATE_SUB(NOW(), INTERVAL 9.5 DAY)),  -- 12 hours later
(@mike_bill1, @mike_id, 200, 'credit_card', 'completed', DATE_SUB(NOW(), INTERVAL 35 DAY));     -- 5 days later

-- Update bill statuses
UPDATE bills SET status = 'paid' WHERE bill_id IN (@sarah_bill1, @sarah_bill2, @sarah_bill3, @mike_bill1);

SELECT 'Sample data loaded successfully!' AS message;
SELECT 'Analytics should now show:' AS info;
SELECT '- Frequent clients: Sarah (3 orders), Mike (2 orders)' AS analytics;
SELECT '- Uncommitted clients: Emma (3 requests), Tom (4 requests)' AS analytics;
SELECT '- Prospective clients: Amy, Chris' AS analytics;
SELECT '- Largest job: Lisa (10 rooms)' AS analytics;
SELECT '- Overdue bills: Mike, Lisa' AS analytics;
SELECT '- Bad clients: Lisa (never paid)' AS analytics;
SELECT '- Good clients: Sarah (always pays within 24h)' AS analytics;
