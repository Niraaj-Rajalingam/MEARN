import { UUID } from "crypto";
import { 
  getTasksForUser,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getTaskById
} from "../task.service";
import { poolQuery, pool } from "../database.service";

afterAll(async () => {
  await pool.end();
});

describe('Task Service', () => {
  // We'll use this test user throughout our tests
  const testUser = async (): Promise<UUID> => {
    const users = await poolQuery('SELECT user_uuid FROM users LIMIT 1;');
    return users?.[0]?.user_uuid;
  };

  let createdTaskId: UUID;

  it('should create a new task', async () => {
    const userId = await testUser();
    const newTask = await createTask({
      user_uuid: userId,
      title: 'Test Task',
      description: 'This is a test task',
      priority: 2,
      due_date: new Date('2025-12-31')
    });

    expect(newTask).toBeDefined();
    expect(newTask?.title).toBe('Test Task');
    expect(newTask?.status).toBe('pending');
    expect(newTask?.priority).toBe(2);

    if (newTask) {
      createdTaskId = newTask.todo_uuid;
    }
  });

  it('should get tasks for user', async () => {
    const userId = await testUser();
    const tasks = await getTasksForUser(userId);

    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks?.length).toBeGreaterThan(0);
  });

  it('should get a specific task by ID', async () => {
    const task = await getTaskById(createdTaskId);

    expect(task).toBeDefined();
    expect(task?.todo_uuid).toBe(createdTaskId);
    expect(task?.title).toBe('Test Task');
  });

  it('should update a task', async () => {
    const updatedTask = await updateTask(createdTaskId, {
      title: 'Updated Test Task',
      priority: 3
    });

    expect(updatedTask).toBeDefined();
    expect(updatedTask?.title).toBe('Updated Test Task');
    expect(updatedTask?.priority).toBe(3);
  });

  it('should complete a task', async () => {
    const completedTask = await completeTask(createdTaskId);

    expect(completedTask).toBeDefined();
    expect(completedTask?.status).toBe('completed');
    expect(completedTask?.completed_at).toBeDefined();
  });

  it('should delete a task', async () => {
    await deleteTask(createdTaskId);
    
    const deletedTask = await getTaskById(createdTaskId);
    expect(deletedTask).toBeUndefined();
  });
});
