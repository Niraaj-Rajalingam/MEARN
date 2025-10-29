import { UUID } from "crypto";
import { 
  searchTasksForUser,
  createTask,
  deleteTask,
  updateTask 
} from "../task.service";
import { pool, poolQuery } from "../database.service";
import { Task } from "../../types/task.type";

describe('Task Search', () => {
  let testUserId: UUID;
  let taskIds: UUID[] = [];
  
  // Store created tasks to reference them in tests
  let tasks: { [key: string]: Task } = {};

  const cleanup = async () => {
    for (const id of taskIds) {
      await deleteTask(id);
    }
    taskIds = [];
    tasks = {};
  };

  beforeAll(async () => {
    await poolQuery('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    // Get test user
    const users = await poolQuery('SELECT user_uuid FROM users LIMIT 1;');
    testUserId = users?.[0]?.user_uuid;
  });

  afterAll(async () => {
    await cleanup();
    await pool.end();
  });

  beforeEach(async () => {
    taskIds = [];
    tasks = {};
    await poolQuery('DELETE FROM todos WHERE user_uuid = $1', [testUserId]);
    
    const taskData = [
      { 
        key: 'in_progress_low',
        title: "Team meeting", 
        description: "Weekly sync", 
        priority: 1 as 1 | 2 | 3, 
        status: 'in_progress' as const, 
        due_date: new Date('2025-11-01') 
      },
      { 
        key: 'pending_high_urgent',
        title: "Fix urgent bug", 
        description: "Production issue", 
        priority: 3 as 1 | 2 | 3, 
        status: 'pending' as const, 
        due_date: new Date('2025-10-29') 
      },
      { 
        key: 'pending_high_later',
        title: "Review PR", 
        description: "Review feature branch", 
        priority: 3 as 1 | 2 | 3, 
        status: 'pending' as const, 
        due_date: new Date('2025-10-30') 
      },
      { 
        key: 'pending_medium_dated',
        title: "Complete documentation", 
        description: "Write API docs", 
        priority: 2 as 1 | 2 | 3, 
        status: 'pending' as const, 
        due_date: new Date('2025-12-31') 
      },
      { 
        key: 'pending_medium_null',
        title: "Plan Q1 roadmap", 
        description: "Strategy session", 
        priority: 2 as 1 | 2 | 3, 
        status: 'pending' as const, 
        due_date: null // For NULLS LAST test
      },
      { 
        key: 'completed_low',
        title: "Old task", 
        description: "Already done", 
        priority: 1 as 1 | 2 | 3, 
        status: 'completed' as const, 
        due_date: new Date('2025-01-01') 
      },
    ];

    for (const data of taskData) {
      const result = await createTask({
        user_uuid: testUserId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.due_date,
      });
      
      if (result?.todo_uuid) {
        const finalTask = await updateTask(result.todo_uuid, { status: data.status });
        if (finalTask) {
          taskIds.push(finalTask.todo_uuid);
          tasks[data.key] = finalTask;
        }
      }
    }
  });

  it('should correctly sort all tasks by default order', async () => {
    const results = await searchTasksForUser(testUserId, {});

    expect(results).toBeDefined();
    expect(results?.length).toBe(6); 

    expect(results?.[0].todo_uuid).toBe(tasks.in_progress_low.todo_uuid);
    
    expect(results?.[1].todo_uuid).toBe(tasks.pending_high_urgent.todo_uuid);
    
    expect(results?.[2].todo_uuid).toBe(tasks.pending_high_later.todo_uuid);
    
    expect(results?.[3].todo_uuid).toBe(tasks.pending_medium_dated.todo_uuid);
    
    expect(results?.[4].todo_uuid).toBe(tasks.pending_medium_null.todo_uuid);
    
    expect(results?.[5].todo_uuid).toBe(tasks.completed_low.todo_uuid);
  });

  it('should find tasks by fuzzy, case-insensitive title match', async () => {
    const results = await searchTasksForUser(testUserId, {
      keyword: "DOCUMENTTION" // Typo and all caps
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(1);
    expect(results?.[0].todo_uuid).toBe(tasks.pending_medium_dated.todo_uuid);
  });

  it('should find tasks by fuzzy, case-insensitive description match', async () => {
    const results = await searchTasksForUser(testUserId, {
      keyword: "producktion" // Typo
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(1);
    expect(results?.[0].todo_uuid).toBe(tasks.pending_high_urgent.todo_uuid);
  });

  it('should filter by multiple priorities', async () => {
    const results = await searchTasksForUser(testUserId, {
      priorities: [1, 2] 
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(4);
    expect(results?.map(t => t.title)).toEqual(
      expect.arrayContaining([
        "Team meeting",
        "Complete documentation",
        "Plan Q1 roadmap",
        "Old task"
      ])
    );
  });

  it('should filter by multiple statuses', async () => {
    const results = await searchTasksForUser(testUserId, {
      statuses: ['pending', 'completed']
    });
    
    expect(results).toBeDefined();
    expect(results?.length).toBe(5); 
    expect(results?.map(t => t.title)).not.toEqual(
      expect.arrayContaining(["Team meeting"])
    );
  });

  it('should filter by date range', async () => {
    const results = await searchTasksForUser(testUserId, {
      dueFrom: new Date('2025-10-01'),
      dueTo: new Date('2025-10-31')
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(2);
    expect(results?.map(t => t.title)).toEqual(
      expect.arrayContaining(["Fix urgent bug", "Review PR"])
    );
  });

  it('should combine multiple filters', async () => {
    const results = await searchTasksForUser(testUserId, {
      keyword: "roadmap",
      priorities: [2],
      statuses: ['pending']
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(1);
    expect(results?.[0].todo_uuid).toBe(tasks.pending_medium_null.todo_uuid);
  });

  it('should handle pagination', async () => {
    const page1 = await searchTasksForUser(testUserId, {
      limit: 4,
      offset: 0
    });

    const page2 = await searchTasksForUser(testUserId, {
      limit: 4,
      offset: 4
    });

    expect(page1).toBeDefined();
    expect(page1?.length).toBe(4);
    expect(page2).toBeDefined();
    expect(page2?.length).toBe(2); 
  });

  it('should return empty array for no matches', async () => {
    const results = await searchTasksForUser(testUserId, {
      keyword: "nonexistent task xyz"
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(0);
  });
});