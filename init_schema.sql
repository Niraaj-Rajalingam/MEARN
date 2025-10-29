-- This SQL script initializes the database for local development
-- If you modify this script, run npm run docker-clean. 
-- Then rerun npm run docker-dev or npm run docker-test to see changes

CREATE EXTENSION "uuid-ossp";

CREATE TABLE users (
    user_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    user_email TEXT, -- effectively used as username
    user_password TEXT
);

INSERT INTO users (first_name, last_name, user_email, user_password) VALUES
    ('Niraaj', 'Rajalingam', 'niraaj@gmail.com', 'mypass123'),
    ('Ridvik', 'Pal', 'ridvik@gmail.com', 'mypass123'),
    ('Eduardo Jose', 'Sampaio Martins', 'eduardo@gmail.com', 'mypass123'),
    ('Matthew', 'Grech', 'matthew@gmail.com', 'mypass123'),
    ('Areeba', 'Mobeen', 'areeba@gmail.com', 'mypass123');

CREATE TABLE tamagotchis (
    tamagotchi_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID REFERENCES users (user_uuid),
    image_path TEXT
);

INSERT INTO tamagotchis (user_uuid, image_path)
SELECT u.user_uuid, t.image_path
FROM users u
JOIN (
    VALUES
        ('Niraaj', '/images/tamagotchi_1.jpg'),
        ('Ridvik', '/images/tamagotchi_2.jpg'),
        ('Eduardo Jose', '/images/tamagotchi_3.jpg')
) AS t (first_name, image_path)
ON u.first_name = t.first_name;

CREATE TABLE todos (
    todo_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID REFERENCES users (user_uuid),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 1,  -- 1: Low, 2: Medium, 3: High etc.
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Add some sample todo items
INSERT INTO todos (user_uuid, title, description, priority, status)
SELECT 
    u.user_uuid,
    'Complete Project Documentation',
    'Write comprehensive documentation for the MEARN project',
    3,
    'pending'
FROM users u
WHERE u.first_name = 'Niraaj'
LIMIT 1;

CREATE TABLE friends (
    first_user_uuid UUID REFERENCES users (user_uuid),
    second_user_uuid UUID REFERENCES users (user_uuid),
    PRIMARY KEY (first_user_uuid, second_user_uuid)
);

-- Insert some sample friend relations
INSERT INTO friends (first_user_uuid, second_user_uuid)
SELECT u.user_uuid, v.user_uuid
FROM users u
JOIN users v
ON u.user_uuid < v.user_uuid;
