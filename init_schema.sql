CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    user_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT
);

INSERT INTO users (first_name, last_name) VALUES
    ('Niraaj', 'Rajalingam'),
    ('Ridvik', 'Pal'),
    ('Eduardo Jose', 'Sampaio Martins'),
    ('Matthew', 'Grech'),
    ('Areeba', 'Mobeen');

CREATE TABLE IF NOT EXISTS tamagotchis (
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
