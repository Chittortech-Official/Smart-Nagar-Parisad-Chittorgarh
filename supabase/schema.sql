-- =========================================================================
-- SMART NAGAR PARISHAD CHITTORGARH - DATABASE SCHEMA & SEED DATA
-- Platform Engineered by ChittorTech
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    default_sla_hours INT NOT NULL DEFAULT 48,
    head_officer_name VARCHAR(100),
    head_officer_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WARDS (All 60 Wards of Nagar Parishad Chittorgarh)
CREATE TABLE IF NOT EXISTS wards (
    ward_number INT PRIMARY KEY CHECK (ward_number BETWEEN 1 AND 60),
    ward_name VARCHAR(100) NOT NULL,
    councillor_name VARCHAR(100),
    councillor_phone VARCHAR(20),
    zone VARCHAR(50) DEFAULT 'Central Zone',
    key_landmarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMPLAINT CATEGORIES
CREATE TABLE IF NOT EXISTS complaint_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    default_sla_hours INT NOT NULL DEFAULT 48,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'SUPER_ADMIN', 
        'PORTAL_MANAGER', 
        'CALL_OPERATOR', 
        'WARD_COUNCILLOR', 
        'DEPARTMENTAL_OFFICER', 
        'CHAIRMAN', 
        'VICE_CHAIRMAN'
    )),
    ward_number INT REFERENCES wards(ward_number),
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPLAINT INTAKE QUEUE (Helpline Calls & WhatsApp Messages - Pending Verification)
CREATE TABLE IF NOT EXISTS complaint_intakes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intake_channel VARCHAR(30) NOT NULL CHECK (intake_channel IN ('HELPLINE_CALL', 'WHATSAPP')),
    citizen_name VARCHAR(100) NOT NULL,
    citizen_phone VARCHAR(20) NOT NULL,
    ward_number INT REFERENCES wards(ward_number),
    address TEXT NOT NULL,
    landmark VARCHAR(200),
    category_id UUID REFERENCES complaint_categories(id),
    problem_description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'ACCEPTED', 'REJECTED')),
    rejection_reason TEXT,
    provider_message_id VARCHAR(150),
    is_after_hours BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES user_profiles(id)
);

-- 6. OFFICIAL COMPLAINT TICKETS (Generated only upon acceptance)
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) NOT NULL UNIQUE, -- e.g. CGR-0001
    intake_id UUID REFERENCES complaint_intakes(id),
    citizen_name VARCHAR(100) NOT NULL,
    citizen_phone VARCHAR(20) NOT NULL,
    ward_number INT NOT NULL REFERENCES wards(ward_number),
    address TEXT NOT NULL,
    landmark VARCHAR(200),
    category_id UUID NOT NULL REFERENCES complaint_categories(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    problem_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'REGISTERED' CHECK (status IN (
        'REGISTERED',
        'IN_PROGRESS',
        'RESOLVED_AWAITING_CITIZEN',
        'CLOSED',
        'REOPENED'
    )),
    forwarding_option VARCHAR(50) DEFAULT 'COUNCILLOR_AND_OFFICER' CHECK (forwarding_option IN (
        'COUNCILLOR_AND_OFFICER',
        'COUNCILLOR_ONLY',
        'OFFICER_ONLY'
    )),
    sla_hours INT NOT NULL DEFAULT 48,
    sla_deadline TIMESTAMPTZ NOT NULL,
    is_overdue BOOLEAN DEFAULT FALSE,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_notes TEXT,
    assigned_officer_id UUID REFERENCES user_profiles(id),
    registration_time TIMESTAMPTZ DEFAULT NOW(),
    resolution_time TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_by UUID REFERENCES user_profiles(id)
);

-- 7. MANDATORY TWO-STEP TICKET CLOSURE TABLES
-- Step 1: Authority Confirmation (Portal Manager verifies with Officer)
CREATE TABLE IF NOT EXISTS authority_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    officer_id UUID REFERENCES user_profiles(id),
    officer_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    verification_notes TEXT NOT NULL,
    verified_by UUID REFERENCES user_profiles(id),
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Citizen Confirmation (Portal Manager calls Citizen directly)
CREATE TABLE IF NOT EXISTS citizen_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    citizen_satisfied BOOLEAN NOT NULL DEFAULT FALSE,
    citizen_feedback TEXT,
    satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    verified_by UUID REFERENCES user_profiles(id),
    confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CALL ATTEMPT AUDIT LOG (When calling citizen or officer)
CREATE TABLE IF NOT EXISTS call_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    intake_id UUID REFERENCES complaint_intakes(id) ON DELETE CASCADE,
    call_target VARCHAR(30) NOT NULL CHECK (call_target IN ('CITIZEN', 'OFFICER', 'COUNCILLOR')),
    phone_number VARCHAR(20) NOT NULL,
    attempt_time TIMESTAMPTZ DEFAULT NOW(),
    call_outcome VARCHAR(50) NOT NULL CHECK (call_outcome IN (
        'ANSWERED_CONFIRMED',
        'ANSWERED_NOT_RESOLVED',
        'NO_ANSWER',
        'BUSY',
        'WRONG_NUMBER'
    )),
    caller_id UUID REFERENCES user_profiles(id),
    notes TEXT
);

-- 9. TICKET STATUS & AUDIT HISTORY
CREATE TABLE IF NOT EXISTS ticket_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. WHATSAPP & SMS NOTIFICATION AUDIT LOGS
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('CITIZEN', 'COUNCILLOR', 'OFFICER', 'CHAIRMAN')),
    recipient_phone VARCHAR(20) NOT NULL,
    channel VARCHAR(30) DEFAULT 'WHATSAPP',
    template_name VARCHAR(100),
    message_content TEXT NOT NULL,
    provider_message_id VARCHAR(150),
    status VARCHAR(30) DEFAULT 'SENT' CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- 11. SYSTEM CONFIGURATION & CALENDAR
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SEED DATA: DEPARTMENTS & SLA
-- =========================================================================
INSERT INTO departments (name, code, default_sla_hours, head_officer_name, head_officer_phone) VALUES
('Sanitation & Garbage Collection', 'SAN', 24, 'Ramesh Sharma', '+919414000101'),
('Street Lighting & Electrical', 'ELE', 48, 'Suresh Chandra Verma', '+919414000102'),
('Roads & Infrastructure Maintenance', 'ROA', 72, 'Mahesh Jat', '+919414000103'),
('Drains & Sewerage Management', 'DRN', 48, 'Kailash Meena', '+919414000104'),
('Waterlogging & Drainage Emergency', 'WAT', 24, 'Dinesh Sen', '+919414000105'),
('Encroachment & Land Monitoring', 'ENC', 72, 'Vikram Singh Rathore', '+919414000106')
ON CONFLICT (name) DO NOTHING;

-- SEED DATA: CATEGORIES
DO $$
DECLARE
    san_id UUID;
    ele_id UUID;
    roa_id UUID;
    drn_id UUID;
    wat_id UUID;
    enc_id UUID;
BEGIN
    SELECT id INTO san_id FROM departments WHERE code = 'SAN';
    SELECT id INTO ele_id FROM departments WHERE code = 'ELE';
    SELECT id INTO roa_id FROM departments WHERE code = 'ROA';
    SELECT id INTO drn_id FROM departments WHERE code = 'DRN';
    SELECT id INTO wat_id FROM departments WHERE code = 'WAT';
    SELECT id INTO enc_id FROM departments WHERE code = 'ENC';

    INSERT INTO complaint_categories (department_id, name, default_sla_hours, description) VALUES
    (san_id, 'Kachra Patra Emptying & Overflow', 24, 'Garbage bin overflowing or not cleared'),
    (san_id, 'Door to Door Waste Collection Vehicle Missed', 24, 'Garbage tipper not visited the lane'),
    (san_id, 'Dead Animal Disposal (Emergency)', 12, 'Urgent carcass removal from public area'),
    (ele_id, 'Streetlight Dark / Defective LED', 48, 'Pole light not glowing at night'),
    (ele_id, 'High-Mast Tower Light Failure', 48, 'Chowk high-mast light off'),
    (roa_id, 'Pothole & Damaged Road Patch', 72, 'Deep pothole causing accidents or traffic issues'),
    (roa_id, 'Broken Divider / Pavement Repair', 72, 'Damaged footpath slab or median'),
    (drn_id, 'Choked Open Drain / Nullah Overflow', 48, 'Dirty drain water spilling over the road'),
    (drn_id, 'Missing or Broken Gutter Slabs', 24, 'Safety hazard: open manhole or broken slab'),
    (wat_id, 'Monsoon Waterlogging on Main Road', 24, 'Stagnant rain water preventing commute'),
    (enc_id, 'Illegal Footpath Encroachment / Tin Shed', 72, 'Obstruction of public walkway or road')
    ON CONFLICT DO NOTHING;
END $$;

-- =========================================================================
-- SEED DATA: ALL 60 WARDS OF CHITTORGARH
-- =========================================================================
INSERT INTO wards (ward_number, ward_name, councillor_name, councillor_phone, zone, key_landmarks) VALUES
(1, 'Ward 1 - Fort Road & Padan Pol', 'Rajendra Bhati', '+919829000001', 'East Zone', 'Padan Pol, Bhairon Pol, Chittorgarh Fort Foothills'),
(2, 'Ward 2 - Meera Nagar & Kumbha Nagar Ext.', 'Sunita Joshi', '+919829000002', 'North Zone', 'Meera Nagar Colony, Community Hall'),
(3, 'Ward 3 - Collectorate & Court Campus', 'Pramod Kumar Sharma', '+919829000003', 'Central Zone', 'District Collectorate, Sessions Court, SP Office'),
(4, 'Ward 4 - Gandhi Nagar Sector A', 'Pooja Vaishnav', '+919829000004', 'Central Zone', 'Gandhi Nagar Main Market, Post Office'),
(5, 'Ward 5 - Gandhi Nagar Sector B', 'Devendra Rao', '+919829000005', 'Central Zone', 'Sector B Park, Govt Girls School'),
(6, 'Ward 6 - Senthi Main Market', 'Mukesh Soni', '+919829000006', 'West Zone', 'Senthi Main Circle, Krishi Mandi Road'),
(7, 'Ward 7 - Senthi Housing Board Phase 1', 'Anita Jain', '+919829000007', 'West Zone', 'RHB Colony, Shivaji Park'),
(8, 'Ward 8 - Senthi Housing Board Phase 2', 'Narendra Chundawat', '+919829000008', 'West Zone', 'Shivaji Garden, Water Tank'),
(9, 'Ward 9 - Pratap Nagar Old', 'Dinesh Kumawat', '+919829000009', 'East Zone', 'Pratap Nagar Chouraha, Shiv Temple'),
(10, 'Ward 10 - Pratap Nagar New & Ganganagar', 'Rekha Meena', '+919829000010', 'East Zone', 'Ganganagar Pulia, Stadium Road'),
(11, 'Ward 11 - Rithola Road & RIICO Industrial', 'Om Prakash Gadri', '+919829000011', 'South Zone', 'RIICO Growth Centre, Marble Mandi'),
(12, 'Ward 12 - Chanderiya Station Colony', 'Mohammad Iqbal', '+919829000012', 'North Zone', 'Chanderiya Railway Station, Birla Shramik Colony'),
(13, 'Ward 13 - Chanderiya Birla Cement Area', 'Bhagwati Lal Dhobi', '+919829000013', 'North Zone', 'Birla Cement Gate No 1, Hospital'),
(14, 'Ward 14 - Gambhiri River Bank West', 'Gopal Lal Teli', '+919829000014', 'Central Zone', 'Old Gambhiri Bridge, Riverfront Ghat'),
(15, 'Ward 15 - Gambhiri River Bank East', 'Kiran Ahir', '+919829000015', 'Central Zone', 'Janta Colony, River Bank Sluice Gate'),
(16, 'Ward 16 - Sadar Bazar & Gol Pyau', 'Ashok Kumar Tank', '+919829000016', 'Central Zone', 'Gol Pyau, Cloth Market, Ghantaghar'),
(17, 'Ward 17 - Subhash Chowk & Sarafa Market', 'Manish Mundra', '+919829000017', 'Central Zone', 'Sarafa Bazar, Bullion Market, Kotwali'),
(18, 'Ward 18 - Kila Road & Rana Sanga Bazar', 'Shailendra Singh', '+919829000018', 'East Zone', 'Rana Sanga Market, Fort Climb Ascent'),
(19, 'Ward 19 - Bapu Nagar West', 'Vimla Sen', '+919829000019', 'West Zone', 'Bapu Nagar Community Centre, Dispensary'),
(20, 'Ward 20 - Bapu Nagar East & Nehru Park', 'Harish Chandra Sahu', '+919829000020', 'West Zone', 'Nehru Children Park, Overhead Reservoir'),
(21, 'Ward 21 - Segwa Housing Board', 'Radheshyam Regar', '+919829000021', 'South Zone', 'Segwa Bypass, RHB Flats, Primary Health Centre'),
(22, 'Ward 22 - Bohera Colony & Shambhupura Link', 'Geeta Kanwar', '+919829000022', 'South Zone', 'Shambhupura Road Link, Railway Crossing'),
(23, 'Ward 23 - Railway Station Road & Overbridge', 'Arun Patidar', '+919829000023', 'Central Zone', 'Chittorgarh Junction Main Entrance, Hotel Line'),
(24, 'Ward 24 - Station Road Gurudwara Area', 'Gurmeet Singh', '+919829000024', 'Central Zone', 'Gurudwara, Bus Stand Overbridge Junction'),
(25, 'Ward 25 - Central Bus Stand & Roadways Depot', 'Laxman Dangi', '+919829000025', 'Central Zone', 'Central Bus Depot, Private Travel Hub'),
(26, 'Ward 26 - Chhittor Fort Upper Plateau Ward A', 'Bhanwar Singh Sisodia', '+919829000026', 'East Zone', 'Vijay Stambh, Samadhishwar Temple, Kirti Stambh'),
(27, 'Ward 27 - Chhittor Fort Upper Plateau Ward B', 'Usha Rajput', '+919829000027', 'East Zone', 'Padmini Palace, Kalika Mata Temple Area'),
(28, 'Ward 28 - Ochhri Bypass & Highway Sector', 'Surendra Gurjar', '+919829000028', 'North Zone', 'Ochhri Highway Toll Link, Petrol Pump'),
(29, 'Ward 29 - Kapasan Chouraha & Mandap Road', 'Mamta Porwal', '+919829000029', 'West Zone', 'Kapasan Chouraha, Mandap Tiraha'),
(30, 'Ward 30 - Chittor General Hospital Campus', 'Dr. Satish Sharma', '+919829000030', 'Central Zone', 'District Hospital, Nursing Hostel, Red Cross'),
(31, 'Ward 31 - Chittor Industrial Area Phase 1', 'Jagdish Chandra Mali', '+919829000031', 'South Zone', 'Industrial Grid Substation, Rice Mill Area'),
(32, 'Ward 32 - Industrial Area Phase 2', 'Nirmala Khatik', '+919829000032', 'South Zone', 'Chemical Factory Lane, Warehouses'),
(33, 'Ward 33 - Bassi Chouraha & NH 27 Corridor', 'Chetan Dashora', '+919829000033', 'East Zone', 'Bassi Flyover, Transport Nagar'),
(34, 'Ward 34 - Transport Nagar', 'Bheru Lal Gadri', '+919829000034', 'East Zone', 'Truck Terminal, Workshop Area'),
(35, 'Ward 35 - Chandan Pura & Muslim Mohalla', 'Aslam Khan', '+919829000035', 'Central Zone', 'Jama Masjid, Madarsa Lane'),
(36, 'Ward 36 - Shanti Nagar & Gyan Nagar', 'Santosh Sharma', '+919829000036', 'North Zone', 'Gyan Mandir School, Park'),
(37, 'Ward 37 - Mahaveer Nagar Extension', 'Hemlata Jain', '+919829000037', 'West Zone', 'Jain Mandir, Mahaveer Colony Community Hall'),
(38, 'Ward 38 - Shivaji Nagar Sector 1', 'Ravi Prakash', '+919829000038', 'West Zone', 'Shivaji Circle, Police Chowki'),
(39, 'Ward 39 - Shivaji Nagar Sector 2', 'Kavita Salvi', '+919829000039', 'West Zone', 'Sector 2 Water Tank, Aganwadi'),
(40, 'Ward 40 - Shastri Nagar Old', 'Vinod Somani', '+919829000040', 'Central Zone', 'Shastri Nagar Main Road, Shopping Complex'),
(41, 'Ward 41 - Shastri Nagar New', 'Kamla Devi', '+919829000041', 'Central Zone', 'Adarsh Vidya Mandir, Stadium Gate'),
(42, 'Ward 42 - Stadium Area & Sports Complex', 'Deepak Sen', '+919829000042', 'Central Zone', 'Indira Gandhi Stadium, Badminton Hall'),
(43, 'Ward 43 - College Road & Girls College Area', 'Maya Chundawat', '+919829000043', 'Central Zone', 'Govt PG College, Girls College Road'),
(44, 'Ward 44 - Poly-technic College & ITI Road', 'Praveen Trivedi', '+919829000044', 'South Zone', 'Govt ITI, Polytechnic Hostel'),
(45, 'Ward 45 - Keshav Nagar', 'Lalit Somani', '+919829000045', 'North Zone', 'Keshav Temple, Garden'),
(46, 'Ward 46 - Vijay Nagar', 'Sunita Gurjar', '+919829000046', 'North Zone', 'Water Supply Pumping Station'),
(47, 'Ward 47 - Bank Colony & LIC Divisional Zone', 'Mahendra Kumar', '+919829000047', 'Central Zone', 'SBI Main Branch, LIC Office'),
(48, 'Ward 48 - Krishi Mandi Yard', 'Babulal Jat', '+919829000048', 'West Zone', 'Grain Mandi Gate 1 & 2, Auction Platform'),
(49, 'Ward 49 - Nimbahera Road Bypass', 'Geeta Ahir', '+919829000049', 'South Zone', 'Nimbahera Toll Plaza Link'),
(50, 'Ward 50 - Sainik School Campus & Environs', 'Col. R. S. Rathore (Retd)', '+919829000050', 'East Zone', 'Sainik School Main Entrance, Parade Ground'),
(51, 'Ward 51 - Manpura Colony', 'Shankar Lal Regar', '+919829000051', 'North Zone', 'Manpura Bus Stand, Hanuman Mandir'),
(52, 'Ward 52 - Eral Extension & Greenfield Hub', 'Pinki Meghwal', '+919829000052', 'West Zone', 'Eral Bypass, Industrial Link Road'),
(53, 'Ward 53 - Anand Vihar & Shanti Niketan', 'Anand Kumar Kothari', '+919829000053', 'West Zone', 'Shanti Niketan Circle, Senior Secondary School'),
(54, 'Ward 54 - Rajiv Gandhi Nagar', 'Pushpa Devi', '+919829000054', 'South Zone', 'Rajiv Gandhi Smriti Park'),
(55, 'Ward 55 - Surya Nagar & Gayatri Nagar', 'Chandra Prakash Sharma', '+919829000055', 'East Zone', 'Gayatri Shakti Peeth, Surya Garden'),
(56, 'Ward 56 - Ram Pol Foothills', 'Harendra Singh', '+919829000056', 'East Zone', 'Ram Pol Entry Gate, Tourist Welcome Centre'),
(57, 'Ward 57 - Bedach Riverfront Sector 1', 'Madhu Teli', '+919829000057', 'North Zone', 'Bedach Bridge Old, Anicut View'),
(58, 'Ward 58 - Bedach Riverfront Sector 2', 'Nathu Lal Dhobi', '+919829000058', 'North Zone', 'Bedach Causeway, Washerman Ghats'),
(59, 'Ward 59 - Chittorgarh Railway Colony Yard', 'Rakesh Srivastava', '+919829000059', 'Central Zone', 'Railway Loco Shed, Officers Rest House'),
(60, 'Ward 60 - New Nagar Parishad Office Campus', 'Dharmendra Chechani', '+919829000060', 'Central Zone', 'Nagar Parishad Administrative Block, Town Hall')
ON CONFLICT (ward_number) DO UPDATE SET 
    ward_name = EXCLUDED.ward_name,
    councillor_name = EXCLUDED.councillor_name,
    councillor_phone = EXCLUDED.councillor_phone,
    zone = EXCLUDED.zone,
    key_landmarks = EXCLUDED.key_landmarks;

-- =========================================================================
-- SEED DATA: DEMO PROFILES (Role-based users)
-- =========================================================================
INSERT INTO user_profiles (full_name, email, phone_number, role) VALUES
('Super Admin ChittorTech', 'admin@chittortech.com', '+919414000001', 'SUPER_ADMIN'),
('Portal Manager Office', 'portalmanager@chittorgarh.gov.in', '+919414000002', 'PORTAL_MANAGER'),
('Call Helpline Operator', 'calloperator@chittorgarh.gov.in', '+919414000003', 'CALL_OPERATOR'),
('Hon. Chairman Chittorgarh', 'chairman@chittorgarh.gov.in', '+919414000004', 'CHAIRMAN'),
('Hon. Vice Chairman', 'vicechairman@chittorgarh.gov.in', '+919414000005', 'VICE_CHAIRMAN')
ON CONFLICT (email) DO NOTHING;

-- SEED DATA: SYSTEM SETTINGS (10:00 AM - 6:00 PM Working Hours & Calendar)
INSERT INTO system_settings (key, value, description) VALUES
('working_hours', '{"start": "10:00", "end": "18:00", "timezone": "Asia/Kolkata", "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]}'::jsonb, 'Helpline and active review working hours'),
('sla_thresholds_hours', '{"EMERGENCY": 12, "SANITATION": 24, "STREETLIGHT": 48, "INFRASTRUCTURE": 72}'::jsonb, 'Standard SLA durations for complaint resolution'),
('whatsapp_api_config', '{"provider": "META_CLOUD_API", "is_test_mode": true, "business_number": "+911472240000", "webhook_verified": true}'::jsonb, 'WhatsApp Business API configuration')
ON CONFLICT (key) DO NOTHING;

-- =========================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ward ON tickets(ward_number);
CREATE INDEX IF NOT EXISTS idx_tickets_department ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_deadline ON tickets(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_complaint_intakes_status ON complaint_intakes(status);
CREATE INDEX IF NOT EXISTS idx_complaint_intakes_channel ON complaint_intakes(intake_channel);
