import { UUID } from "crypto";
import { 
  searchTasksForUser,
  createTask,
  deleteTask 
} from "../task.service";
import { pool, poolQuery } from "../database.service";
import { Task } from "../../types/task.type";

type TaskStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

describe('Task Search', () => {
  let testUserId: UUID;
  let taskIds: UUID[] = [];
  
  let tasks: { [key: string]: Task } = {};

  const cleanup = async () => {
    if (testUserId) {
      await poolQuery(`
        DELETE FROM todos WHERE todo_uuid IN (
          SELECT task_uuid FROM task_assignees WHERE user_uuid = $1
        )
      `, [testUserId]);
    }
    
    taskIds = [];
    tasks = {};
  };

  beforeAll(async () => {
    await poolQuery('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    const users = await poolQuery(`SELECT user_uuid FROM users WHERE first_name = 'Niraaj';`);
    testUserId = users?.[0]?.user_uuid;
  });

  afterAll(async () => {
    await cleanup();
    await pool.end();
  });

  afterEach(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
    
    const taskData = [
      { 
        key: 'in_progress_low',
        title: "Team meeting", 
        description: "Weekly sync", 
        priority: 1 as 1 | 2 | 3, 
        status: 'in_progress' as TaskStatus, 
        due_date: new Date('2025-11-01') 
      },
      { 
        key: 'pending_high_urgent',
        title: "Fix urgent bug", 
        description: "Production issue", 
        priority: 3 as 1 | 2 | 3, 
        status: 'pending' as TaskStatus, 
        due_date: new Date('2025-10-29') 
      },
      { 
        key: 'pending_high_later',
        title: "Review PR", 
        description: "Review feature branch", 
        priority: 3 as 1 | 2 | 3, 
        status: 'pending' as TaskStatus, 
        due_date: new Date('2025-10-30') 
      },
      { 
        key: 'pending_medium_dated',
        title: "Complete documentation", 
        description: "Write API docs", 
        priority: 2 as 1 | 2 | 3, 
        status: 'pending' as TaskStatus, 
        due_date: new Date('2025-12-31') 
      },
      { 
        key: 'pending_medium_null',
        title: "Plan Q1 roadmap", 
        description: "Strategy session", 
        priority: 2 as 1 | 2 | 3, 
        status: 'pending' as TaskStatus, 
        due_date: null 
      },
      { 
        key: 'completed_low',
        title: "Old task", 
        description: "Already done", 
        priority: 1 as 1 | 2 | 3, 
        status: 'completed' as TaskStatus, 
        due_date: new Date('2025-01-01') 
      },
      { 
        key: 'draft_low',
        title: "New idea", 
        description: "Just a draft", 
        priority: 1 as 1 | 2 | 3, 
        status: 'draft' as TaskStatus, 
        due_date: null
      },
    ];

    for (const data of taskData) {
      const result = await createTask({
        created_by: testUserId,
        assignee_uuids: [testUserId],
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.due_date || undefined,
        status: data.status,
      });
      
      if (result?.todo_uuid) {
        taskIds.push(result.todo_uuid);
        tasks[data.key] = result;
      }
    }
  });

  it('should correctly sort all tasks by default order', async () => {
    const results = await searchTasksForUser(testUserId, {});

    expect(results).toBeDefined();
    expect(results?.length).toBe(7); 

    expect(results?.[0].todo_uuid).toBe(tasks.in_progress_low.todo_uuid); // 1
    expect(results?.[1].todo_uuid).toBe(tasks.pending_high_urgent.todo_uuid); // 2
    expect(results?.[2].todo_uuid).toBe(tasks.pending_high_later.todo_uuid); // 3
    expect(results?.[3].todo_uuid).toBe(tasks.pending_medium_dated.todo_uuid); // 4
    expect(results?.[4].todo_uuid).toBe(tasks.pending_medium_null.todo_uuid); // 5 (nulls last)
    expect(results?.[5].todo_uuid).toBe(tasks.completed_low.todo_uuid); // 6
    expect(results?.[6].todo_uuid).toBe(tasks.draft_low.todo_uuid); // 7
  });

  it('should find tasks by fuzzy, case-insensitive title match', async () => {
    const results = await searchTasksForUser(testUserId, {
      keyword: "DOCUMENTTION"
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(1);
    expect(results?.[0].todo_uuid).toBe(tasks.pending_medium_dated.todo_uuid);
  });

  it('should find tasks by fuzzy, case-insensitive description match', async () => {
    const results = await searchTasksForUser(testUserId, {
      keyword: "producktion"
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
    expect(results?.length).toBe(5);
    expect(results?.map(t => t.title)).toEqual(
      expect.arrayContaining([
        "Team meeting",
        "Complete documentation",
        "Plan Q1 roadmap",
        "Old task",
        "New idea"
      ])
    );
  });

  it('should filter by multiple statuses', async () => {
    const results = await searchTasksForUser(testUserId, {
      statuses: ['pending', 'completed', 'draft']
    });
    
    expect(results).toBeDefined();
    expect(results?.length).toBe(6); 
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
    expect(page2?.length).toBe(3); 
  });

  it('should return empty array for no matches', async () => {
    const results = await searchTasksForUser(testUserId, {
      keyword: "nonexistent task xyz"
    });

    expect(results).toBeDefined();
    expect(results?.length).toBe(0);
  });
});
