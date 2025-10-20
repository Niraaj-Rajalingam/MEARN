CREATE TABLE if NOT EXISTS user {
    user_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT
}

INSERT INTO user (first_name, last_name) VALUES
    ("Niraaj", "Rajalingam"),
    ("Ridvik", "Pal"),
    ("Eduardo Jose", "Sampaio Martins"),
    ("Matthew", "Grech"),
    ("Areeba", "Mobeen");

CREATE TABLE IF NOT EXISTS tamagotchi (
    tamagotchi_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID REFERENCES user (user_uuid),
    image_path TEXT
);

INSERT INTO tamagotchi (image_path) VALUES
    ('test 1'),
    ('test 2'),
    ('test 3');
