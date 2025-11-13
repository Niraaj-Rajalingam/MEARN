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

CREATE TABLE user_preferences (
    user_uuid UUID PRIMARY KEY REFERENCES users (user_uuid) ON DELETE CASCADE,
    theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
    accent_color TEXT DEFAULT 'indigo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE happiness_history (
    history_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_uuid UUID REFERENCES users (user_uuid) ON DELETE CASCADE,
    date DATE NOT NULL,
    happiness_score DECIMAL(3, 1) NOT NULL,
    completed_tasks INTEGER DEFAULT 0,
    incomplete_tasks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, date)
);

CREATE INDEX idx_happiness_history_user_date ON happiness_history(user_uuid, date DESC);

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

-- Initialize user preferences with default theme settings
INSERT INTO user_preferences (user_uuid, theme_mode, accent_color)
SELECT user_uuid, 'light', 'indigo'
FROM users;

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
        ('Eduardo Jose', '/images/tamagotchi_3.jpg'),
        ('Matthew', '/images/tamagotchi_4.jpg'),
        ('Areeba', '/images/tamagotchi_5.jpg')
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

-- Add group memberships with various roles
INSERT INTO group_members (group_uuid, user_uuid, role)
SELECT g.group_uuid, u.user_uuid,
  CASE
    WHEN g.group_name = 'ECE454 Project' AND u.first_name = 'Niraaj' THEN 'admin'
    WHEN g.group_name = 'ECE467 Project' AND u.first_name = 'Matthew' THEN 'admin'
    WHEN g.group_name = 'Personal' THEN 'admin'
    ELSE 'member'
  END as role
FROM groups g, users u
WHERE (g.group_name = 'ECE454 Project' AND u.first_name IN ('Niraaj', 'Ridvik', 'Eduardo Jose', 'Matthew'))
   OR (g.group_name = 'ECE467 Project' AND u.first_name IN ('Matthew', 'Areeba', 'Ridvik'))
   OR (g.group_name = 'Personal' AND u.first_name IN ('Niraaj', 'Ridvik', 'Eduardo Jose', 'Matthew', 'Areeba'));

INSERT INTO group_members (group_uuid, user_uuid, role)
SELECT g.group_uuid, u.user_uuid, 'member'
FROM groups g, users u
WHERE g.group_name = 'Frontend Team' AND u.first_name IN ('Niraaj', 'Ridvik', 'Eduardo Jose');

-- More comprehensive tasks for ECE454 Project
WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Niraaj'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Setup Database Schema',
    'Initialize PostgreSQL database with all required tables and relationships',
    3,
    'completed',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() - INTERVAL '7 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    u.user_uuid
FROM new_task, users u
WHERE u.first_name IN ('Niraaj', 'Ridvik');

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Eduardo Jose'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, completed_at, due_date)
  VALUES (
    'Backend API Development',
    'Implement REST API endpoints for task management',
    3,
    'completed',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    u.user_uuid
FROM new_task, users u
WHERE u.first_name IN ('Eduardo Jose', 'Niraaj');

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Ridvik'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Design System & UI Components',
    'Create reusable component library with Tailwind CSS',
    2,
    'in_progress',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() + INTERVAL '5 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    u.user_uuid
FROM new_task, users u
WHERE u.first_name IN ('Ridvik', 'Niraaj');

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Matthew'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'User Authentication System',
    'Implement JWT-based authentication and authorization',
    3,
    'in_progress',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() + INTERVAL '3 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    u.user_uuid
FROM new_task, users u
WHERE u.first_name IN ('Matthew', 'Niraaj', 'Eduardo Jose');

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Niraaj'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Test Coverage & Quality Assurance',
    'Write unit tests and integration tests for all modules',
    2,
    'pending',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() + INTERVAL '10 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    u.user_uuid
FROM new_task, users u
WHERE u.first_name IN ('Niraaj', 'Areeba');

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Ridvik'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE454 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Mobile App Development',
    'Create cross-platform mobile app using React Native',
    1,
    'cancelled',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() + INTERVAL '30 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    (SELECT user_uuid FROM users WHERE first_name = 'Ridvik')
FROM new_task;

-- Tasks for ECE467 Project
WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Matthew'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE467 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Signal Processing Implementation',
    'Implement digital signal processing algorithms',
    3,
    'in_progress',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() + INTERVAL '7 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    u.user_uuid
FROM new_task, users u
WHERE u.first_name IN ('Matthew', 'Areeba');

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Areeba'
),
project AS (
  SELECT group_uuid FROM groups WHERE group_name = 'ECE467 Project'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'FPGA Design and Verification',
    'Design and verify FPGA implementation',
    3,
    'pending',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM project),
    NOW() + INTERVAL '14 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    u.user_uuid
FROM new_task, users u
WHERE u.first_name IN ('Areeba', 'Matthew');

-- Personal tasks for various users
WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Niraaj'
),
personal AS (
  SELECT group_uuid FROM groups WHERE group_name = 'Personal'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Learn Advanced TypeScript',
    'Complete TypeScript deep dive course',
    2,
    'in_progress',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM personal),
    NOW() + INTERVAL '20 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    (SELECT user_uuid FROM creator)
FROM new_task;

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Eduardo Jose'
),
personal AS (
  SELECT group_uuid FROM groups WHERE group_name = 'Personal'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, completed_at, due_date)
  VALUES (
    'Gym Workout Routine',
    'Complete 5 days of strength training',
    1,
    'completed',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM personal),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    (SELECT user_uuid FROM creator)
FROM new_task;

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Matthew'
),
personal AS (
  SELECT group_uuid FROM groups WHERE group_name = 'Personal'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Read Research Papers',
    'Review 3 key papers on machine learning',
    2,
    'pending',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM personal),
    NOW() + INTERVAL '15 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    (SELECT user_uuid FROM creator)
FROM new_task;

WITH creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Areeba'
),
personal AS (
  SELECT group_uuid FROM groups WHERE group_name = 'Personal'
),
new_task AS (
  INSERT INTO todos (title, description, priority, status, created_by, group_uuid, due_date)
  VALUES (
    'Plan Trip to Europe',
    'Book flights and accommodations for summer trip',
    1,
    'pending',
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM personal),
    NOW() + INTERVAL '45 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
    new_task.todo_uuid,
    (SELECT user_uuid FROM creator)
FROM new_task;

-- Subtasks for Project Documentation
WITH parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Complete Project Documentation'
),
creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Niraaj'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid)
  VALUES (
    'Write Installation Guide',
    'Create step-by-step installation instructions',
    2,
    'in_progress',
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

WITH parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Complete Project Documentation'
),
creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Ridvik'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid)
  VALUES (
    'Document Component Library',
    'Add JSDoc comments and Storybook stories',
    2,
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

-- Subtasks for Backend API Development
WITH parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Backend API Development'
),
creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Eduardo Jose'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid, completed_at, due_date)
  VALUES (
    'Implement User Endpoints',
    'Create GET, POST, PUT, DELETE for /users',
    3,
    'completed',
    (SELECT todo_uuid FROM parent),
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM parent),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
  new_subtask.todo_uuid,
  u.user_uuid
FROM new_subtask, users u
WHERE u.first_name IN ('Eduardo Jose', 'Niraaj');

WITH parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Backend API Development'
),
creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Niraaj'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid, completed_at, due_date)
  VALUES (
    'Implement Task Endpoints',
    'Create GET, POST, PUT, DELETE for /tasks',
    3,
    'completed',
    (SELECT todo_uuid FROM parent),
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM parent),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
  new_subtask.todo_uuid,
  u.user_uuid
FROM new_subtask, users u
WHERE u.first_name IN ('Niraaj', 'Eduardo Jose');

WITH parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Backend API Development'
),
creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Eduardo Jose'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid, due_date)
  VALUES (
    'Add Database Migrations',
    'Setup migration system and create migration scripts',
    2,
    'in_progress',
    (SELECT todo_uuid FROM parent),
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM parent),
    NOW() + INTERVAL '2 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
  new_subtask.todo_uuid,
  (SELECT user_uuid FROM creator)
FROM new_subtask;

-- Subtasks for Design System
WITH parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Design System & UI Components'
),
creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Ridvik'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid, due_date)
  VALUES (
    'Create Button Variants',
    'Design primary, secondary, and tertiary button styles',
    2,
    'completed',
    (SELECT todo_uuid FROM parent),
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM parent),
    NOW() - INTERVAL '8 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
  new_subtask.todo_uuid,
  (SELECT user_uuid FROM creator)
FROM new_subtask;

WITH parent AS (
  SELECT todo_uuid, group_uuid FROM todos WHERE title = 'Design System & UI Components'
),
creator AS (
  SELECT user_uuid FROM users WHERE first_name = 'Ridvik'
),
new_subtask AS (
  INSERT INTO todos (title, description, priority, status, parent_task_uuid, created_by, group_uuid, due_date)
  VALUES (
    'Create Form Components',
    'Build input, select, checkbox, and radio components',
    2,
    'in_progress',
    (SELECT todo_uuid FROM parent),
    (SELECT user_uuid FROM creator),
    (SELECT group_uuid FROM parent),
    NOW() + INTERVAL '3 days'
  )
  RETURNING todo_uuid
)
INSERT INTO task_assignees (task_uuid, user_uuid)
SELECT
  new_subtask.todo_uuid,
  u.user_uuid
FROM new_subtask, users u
WHERE u.first_name IN ('Ridvik', 'Niraaj');

-- Friend relationships with various statuses
-- Create accepted friendships between all users (all pairs in both directions)
INSERT INTO friend_requests (requester_uuid, recipient_uuid, status)
SELECT
    u1.user_uuid,
    u2.user_uuid,
    'accepted'
FROM users u1, users u2
WHERE u1.user_uuid != u2.user_uuid AND u1.user_uuid < u2.user_uuid
ON CONFLICT (requester_uuid, recipient_uuid) DO NOTHING;

-- Add some pending friend requests from users who might not have connections yet
INSERT INTO friend_requests (requester_uuid, recipient_uuid, status)
VALUES (
    (SELECT user_uuid FROM users WHERE first_name = 'Areeba'),
    (SELECT user_uuid FROM users WHERE first_name = 'Eduardo Jose'),
    'pending'
)
ON CONFLICT (requester_uuid, recipient_uuid) DO NOTHING;

INSERT INTO friend_requests (requester_uuid, recipient_uuid, status)
VALUES (
    (SELECT user_uuid FROM users WHERE first_name = 'Matthew'),
    (SELECT user_uuid FROM users WHERE first_name = 'Ridvik'),
    'pending'
)
ON CONFLICT (requester_uuid, recipient_uuid) DO NOTHING;

