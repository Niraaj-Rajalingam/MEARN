-- This SQL script initializes the database for local development
-- If you modify this script, delete your mearn-database container, image, and
-- data volume in docker. Then rerun docker compose up --watch to see changes

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
