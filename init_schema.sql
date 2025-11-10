-- This SQL script initializes the database for local development
-- If you modify this script, run npm run docker-clean. 
-- Then rerun npm run docker-dev or npm run docker-test to see changes

CREATE EXTENSION "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
    user_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    user_email TEXT UNIQUE,
    user_password TEXT,
    color_scheme INTEGER[] DEFAULT ARRAY[79, 70, 229]  -- RGB array [R, G, B] for user's color theme
);

CREATE TABLE groups (
    group_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_group_uuid UUID REFERENCES groups (group_uuid) ON DELETE CASCADE,
    group_name TEXT NOT NULL
);

CREATE TABLE group_members (
    group_uuid UUID REFERENCES groups (group_uuid) ON DELETE CASCADE,
    user_uuid UUID REFERENCES users (user_uuid) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    PRIMARY KEY (group_uuid, user_uuid)
);

CREATE TABLE tamagotchis (
    tamagotchi_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID REFERENCES users (user_uuid),
    image_path TEXT,
    health INTEGER DEFAULT 100 CHECK (health >= 0 AND health <= 100),
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
);

CREATE TABLE todos (
    todo_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_task_uuid UUID REFERENCES todos (todo_uuid) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users (user_uuid),
    group_uuid UUID REFERENCES groups (group_uuid) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft','pending', 'in_progress', 'completed', 'cancelled'))
);

CREATE TABLE task_assignees (
    task_uuid UUID REFERENCES todos (todo_uuid) ON DELETE CASCADE,
    user_uuid UUID REFERENCES users (user_uuid) ON DELETE CASCADE,
    PRIMARY KEY (task_uuid, user_uuid)
);

CREATE TABLE friend_requests (
    request_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_uuid UUID NOT NULL REFERENCES users (user_uuid) ON DELETE CASCADE,
    recipient_uuid UUID NOT NULL REFERENCES users (user_uuid) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_uuid, recipient_uuid)
);

INSERT INTO users (first_name, last_name, user_email, user_password, color_scheme) VALUES
    ('Niraaj', 'Rajalingam', 'niraaj@gmail.com', 'mypass123', ARRAY[79, 70, 229]),    -- Indigo
    ('Ridvik', 'Pal', 'ridvik@gmail.com', 'mypass123', ARRAY[236, 72, 153]),          -- Pink
    ('Eduardo Jose', 'Sampaio Martins', 'eduardo@gmail.com', 'mypass123', ARRAY[234, 88, 12]),  -- Orange
    ('Matthew', 'Grech', 'matthew@gmail.com', 'mypass123', ARRAY[16, 185, 129]),      -- Green
    ('Areeba', 'Mobeen', 'areeba@gmail.com', 'mypass123', ARRAY[139, 92, 246]);

INSERT INTO groups (group_name) VALUES
    ('ECE454 Project'),
    ('ECE467 Project'),
    ('Personal');

WITH parent_group AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
)
INSERT INTO groups (group_name, parent_group_uuid)
VALUES (
  'Frontend Team',
  (SELECT group_uuid FROM parent_group)
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

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Niraaj'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid)
  VALUES (
    'Complete Project Documentation',
    'Write comprehensive documentation for the MEARN project',
    3,
    'pending',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project)
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT 
    new_task.todo_uuid,
    (SELECT user_uuid FROM creator)
FROM new_task;

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Ridvik'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
shared_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid)
  VALUES (
    'Prepare Group Presentation',
    'Create slides for the ECE454 demo',
    2,
    'in_progress',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project)
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT 
    shared_task.todo_uuid,
    u.user_uuid
FROM shared_task, users u
WHERE u.first_name IN ('Niraaj', 'Ridvik', 'Eduardo Jose');

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Niraaj'
),
parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Complete Project Documentation'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid)
  VALUES (
    'Draft API endpoints',
    'Document all /api/v1/ routes',
    3,
    'pending',
    (SELECT todo_uuid FROM parent),
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM parent)
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
  new_subtask.todo_uuid,
  (SELECT user_uuid FROM creator)
FROM new_subtask;

INSERT INTO friend_requests (requester_uuid, recipient_uuid, status)
SELECT u.user_uuid, v.user_uuid, 'accepted'
FROM users u
JOIN users v
ON u.user_uuid < v.user_uuid;

