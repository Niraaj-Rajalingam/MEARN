'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { Task } from '@/app/types/task.type';
import type { Group } from '@/app/types/group.type';
import TaskFilter, { type TaskFilterType } from '@/app/components/TaskFilter';
import FlashMessage from '@/app/components/FlashMessage';
import type { Tamagotchi } from '@/app/types/tamagotchi.type';
import { TamagotchiDisplay } from '@/components/features/tamagotchi/TamagotchiDisplay';
import { searchActiveDashboardTasksAction, getFilteredDashboardTasksAction, deleteGroupAction } from './actions';
import { useFlashMessage } from '@/app/utils/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { findUserByEmailAction, createGroupAction } from '@/app/groups/[user_uuid]/add/actions';
import { createTaskAction } from '@/app/tasks/[user_uuid]/add/actions';
import { isEmail } from '@/app/utils/validation';

type DashboardClientProps = {
  userUuid: string;
};

type AddedMember = {
  user_uuid: string;
  email: string;
  label?: string | null;
};

type GroupFormErrors = {
  groupName?: string;
  pendingEmail?: string;
  general?: string;
};

type TaskFormErrors = {
  title?: string;
  assigneeEmail?: string;
  dueDate?: string;
  general?: string;
};

export default function DashboardClient({ userUuid }: DashboardClientProps) {
  const { message, messageKind, flash, resetFlash } = useFlashMessage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupUuid, setSelectedGroupUuid] = useState<Group['group_uuid'] | null>(null);
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [tamagotchiStats, setTamagotchiStats] = useState({
    completed_tasks: 0,
    incomplete_tasks: 0,
    total_tasks: 0,
    happiness_score: 0
  });
  const [levelInfo, setLevelInfo] = useState({
    level: 1,
    daysAtThreshold: 0,
    nextLevelThreshold: null as number | null,
    daysNeeded: null as number | null,
    progressMessage: ''
  });
  const [userColor, setUserColor] = useState<number[]>([79, 70, 229]); // Default indigo
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteGroupUuid, setDeleteGroupUuid] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [pendingGroupEmail, setPendingGroupEmail] = useState('');
  const [groupMembers, setGroupMembers] = useState<AddedMember[]>([]);
  const [groupFormErrors, setGroupFormErrors] = useState<GroupFormErrors>({});
  const [isCheckingMember, setIsCheckingMember] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'1' | '2' | '3'>('2');
  const [taskAssigneeEmail, setTaskAssigneeEmail] = useState('');
  const [taskFormErrors, setTaskFormErrors] = useState<TaskFormErrors>({});
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const activeTasks = useMemo(() => (
    tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled')
  ), [tasks]);

  const allowTaskAssigneeInput = Boolean(selectedGroupUuid);

  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);

  const resetGroupForm = useCallback(() => {
    setGroupName('');
    setPendingGroupEmail('');
    setGroupMembers([]);
    setGroupFormErrors({});
    setIsCheckingMember(false);
    setIsCreatingGroup(false);
  }, []);

  const resetTaskForm = useCallback(() => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setTaskPriority('2');
    setTaskAssigneeEmail('');
    setTaskFormErrors({});
    setIsCreatingTask(false);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTasks(activeTasks);
    }
  }, [activeTasks]);

  useEffect(() => {
    if (!allowTaskAssigneeInput && taskAssigneeEmail) {
      setTaskAssigneeEmail('');
      setTaskFormErrors((prev) => ({ ...prev, assigneeEmail: undefined }));
    }
  }, [allowTaskAssigneeInput, taskAssigneeEmail]);

  useEffect(() => {
    if (!isCreateGroupOpen) {
      resetGroupForm();
    }
  }, [isCreateGroupOpen, resetGroupForm]);

  useEffect(() => {
    if (!isCreateTaskOpen) {
      resetTaskForm();
    }
  }, [isCreateTaskOpen, resetTaskForm]);

  useEffect(() => {
    async function fetchDashboard() {
      const query = selectedGroupUuid ? `?group=${selectedGroupUuid}` : '';
      const res = await fetch(`/api/dashboard/${userUuid}${query}`);
      if (!res.ok) return;
      const data = await res.json();
      const normalizedTasks = (data.tasks || []).map((task: Task) => ({
        ...task,
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
        created_at: new Date(task.created_at),
      }));
      setTasks(normalizedTasks);
      setGroups(data.groups || []);
      setSelectedGroupUuid((prev) => {
        if (!prev) return null;
        return data.groups?.some((group: Group) => group.group_uuid === prev) ? prev : null;
      });
      setTamagotchi(data.tamagotchi || null);
      setTamagotchiStats(data.tamagotchiStats || {
        completed_tasks: 0,
        incomplete_tasks: 0,
        total_tasks: 0,
        happiness_score: 0
      });
      setLevelInfo(data.levelInfo || {
        level: 1,
        daysAtThreshold: 0,
        nextLevelThreshold: null,
        daysNeeded: null,
        progressMessage: ''
      });
      setUserColor(data.userColor || [79, 70, 229]);
    }
    fetchDashboard();
  }, [userUuid, selectedGroupUuid]);

  const handleCompleteTask = async (todo_uuid: string) => {
    try {
      const res = await fetch(`/api/tasks/${todo_uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!res.ok) {
        throw new Error('Failed to complete task');
      }

      const data = await res.json();
      const completedAtValue = data.task?.completed_at ? new Date(data.task.completed_at) : new Date();

      setTasks((prevTasks) =>
        prevTasks.map(t =>
          t.todo_uuid === todo_uuid
            ? { ...t, status: 'completed', completed_at: completedAtValue }
            : t
        )
      );

      // Refresh dashboard to update happiness score and level
      const query = selectedGroupUuid ? `?group=${selectedGroupUuid}` : '';
      const dashboardRes = await fetch(`/api/dashboard/${userUuid}${query}`);
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setTamagotchi(dashboardData.tamagotchi || null);
        setTamagotchiStats(dashboardData.tamagotchiStats || {
          completed_tasks: 0,
          incomplete_tasks: 0,
          total_tasks: 0,
          happiness_score: 0
        });
        setLevelInfo(dashboardData.levelInfo || {
          level: 1,
          daysAtThreshold: 0,
          nextLevelThreshold: null,
          daysNeeded: null,
          progressMessage: ''
        });
      }
    } catch (error) {
      console.error('Unable to complete task:', error);
    }
  };

  const handleDeleteTask = async (todo_uuid: string) => {
    try {
      const res = await fetch(`/api/tasks/${todo_uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) {
        throw new Error('Failed to delete task');
      }
      setTasks((prevTasks) => prevTasks.filter((task) => task.todo_uuid !== todo_uuid));
    } catch (error) {
      console.error('Unable to delete task:', error);
    }
  };

  const handleAddGroupMember = async () => {
    setGroupFormErrors((prev) => ({ ...prev, pendingEmail: undefined, general: undefined }));
    const email = pendingGroupEmail.trim().toLowerCase();

    if (!email) {
      setGroupFormErrors((prev) => ({ ...prev, pendingEmail: 'Enter a user email.' }));
      return;
    }

    if (!isEmail(email)) {
      setGroupFormErrors((prev) => ({ ...prev, pendingEmail: 'Invalid email format.' }));
      return;
    }

    if (groupMembers.some((member) => member.email.toLowerCase() === email)) {
      setGroupFormErrors((prev) => ({ ...prev, pendingEmail: 'This email is already in the list.' }));
      return;
    }

    setIsCheckingMember(true);
    try {
      const result = await findUserByEmailAction(email);

      if (!result.success) {
        setGroupFormErrors((prev) => ({
          ...prev,
          pendingEmail: result.error || 'Could not verify user. Please try again.',
        }));
        return;
      }

      const label = result.user.name || result.user.email || `User ${result.user.user_uuid}`;
      setGroupMembers((prev) => [
        ...prev,
        {
          user_uuid: String(result.user.user_uuid),
          email: result.user.email,
          label,
        },
      ]);
      setPendingGroupEmail('');
    } catch (error) {
      console.error('Failed to verify user email:', error);
      setGroupFormErrors((prev) => ({ ...prev, general: 'Failed to verify user. Please try again.' }));
    } finally {
      setIsCheckingMember(false);
    }
  };

  const handleRemoveGroupMember = (email: string) => {
    setGroupMembers((prev) => prev.filter((member) => member.email.toLowerCase() !== email.toLowerCase()));
    setGroupFormErrors((prev) => ({ ...prev, pendingEmail: undefined }));
  };

  const handleCreateGroupSubmit = async () => {
    setGroupFormErrors((prev) => ({ ...prev, groupName: undefined, general: undefined }));

    if (!groupName.trim()) {
      setGroupFormErrors((prev) => ({ ...prev, groupName: 'Please enter a group name.' }));
      return;
    }

    setIsCreatingGroup(true);
    try {
      const result = await createGroupAction({
        groupName: groupName.trim(),
        creatorUuid: userUuid,
        memberEmails: groupMembers.map((member) => member.email),
      });

      if (!result.success) {
        setGroupFormErrors((prev) => ({
          ...prev,
          general: result.error || 'Failed to create group.',
        }));
        return;
      }

      const newGroup = result.group as Group;
      setGroups((prev) => [...prev, newGroup]);
      setSelectedGroupUuid(newGroup.group_uuid);
      flash('success', `Group "${newGroup.group_name}" created successfully.`);
      resetGroupForm();
      setIsCreateGroupOpen(false);
    } catch (error) {
      console.error('Unable to create group:', error);
      setGroupFormErrors((prev) => ({ ...prev, general: 'Failed to create group. Please try again.' }));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCreateTaskSubmit = async () => {
    setTaskFormErrors((prev) => ({
      ...prev,
      title: undefined,
      assigneeEmail: undefined,
      dueDate: undefined,
      general: undefined,
    }));

    if (!taskTitle.trim()) {
      setTaskFormErrors((prev) => ({ ...prev, title: 'Please enter a task title.' }));
      return;
    }

    if (taskDueDate && Number.isNaN(new Date(taskDueDate).getTime())) {
      setTaskFormErrors((prev) => ({ ...prev, dueDate: 'Enter a valid date.' }));
      return;
    }

    const trimmedAssignee = taskAssigneeEmail.trim();

    if (allowTaskAssigneeInput && trimmedAssignee && !isEmail(trimmedAssignee)) {
      setTaskFormErrors((prev) => ({ ...prev, assigneeEmail: 'Enter a valid email address.' }));
      return;
    }

    if (!allowTaskAssigneeInput && trimmedAssignee) {
      setTaskFormErrors((prev) => ({
        ...prev,
        assigneeEmail: 'Select a group before assigning someone else.',
      }));
      return;
    }

    setIsCreatingTask(true);
    try {
      const result = await createTaskAction({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        dueDate: taskDueDate,
        priority: taskPriority,
        assigneeEmail: trimmedAssignee || undefined,
        creatorUuid: userUuid,
        groupUuid: selectedGroupUuid ? String(selectedGroupUuid) : null,
      });

      if (!result.success) {
        setTaskFormErrors((prev) => ({
          ...prev,
          general: result.error || 'Failed to create task.',
        }));
        return;
      }

      const createdTask: Task = {
        ...result.task,
        created_at: new Date(result.task.created_at),
        completed_at: result.task.completed_at ? new Date(result.task.completed_at) : undefined,
        due_date: result.task.due_date ? new Date(result.task.due_date) : undefined,
      };

      setTasks((prev) => [createdTask, ...prev]);
      flash('success', `Task "${result.task.title}" created successfully.`);
      resetTaskForm();
      setIsCreateTaskOpen(false);
    } catch (error) {
      console.error('Unable to create task:', error);
      setTaskFormErrors((prev) => ({ ...prev, general: 'Failed to create task. Please try again.' }));
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleSelectGroup = (group_uuid: Group['group_uuid']) => {
    setSelectedGroupUuid((prev) => (prev === group_uuid ? null : group_uuid));
  };

  const handleDeleteGroupClick = (groupUuid: string) => {
    setDeleteGroupUuid(groupUuid);
    setShowDeleteModal(true);
    setDeleteConfirmInput('');
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupUuid) return;

    const groupToDelete = groups.find((g) => String(g.group_uuid) === deleteGroupUuid);
    if (!groupToDelete) return;

    if (deleteConfirmInput.trim() !== groupToDelete.group_name.trim()) {
      flash('error', 'Group name does not match.');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteGroupAction({
        groupUuid: deleteGroupUuid,
        userUuid,
        groupName: groupToDelete.group_name,
        confirmationInput: deleteConfirmInput,
      });

      if (!result.success) {
        flash('error', result.error || 'Failed to delete group.');
        return;
      }

      flash('success', result.message || 'Group deleted successfully');
      setShowDeleteModal(false);
      setDeleteConfirmInput('');
      setDeleteGroupUuid(null);

      // Remove the deleted group from the list
      setGroups((prev) => prev.filter((g) => String(g.group_uuid) !== deleteGroupUuid));

      // Clear selection if the deleted group was selected
      if (selectedGroupUuid === deleteGroupUuid) {
        setSelectedGroupUuid(null);
      }

      // Refresh dashboard after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error deleting group:', err);
      flash('error', 'Failed to delete group.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Apply filter when filter type changes (without search)
  useEffect(() => {
    if (searchQuery.trim()) return; // Skip if searching

    async function applyFilter() {
      try {
        const result = await getFilteredDashboardTasksAction(
          userUuid,
          selectedGroupUuid,
          taskFilter
        );

        if (result.success) {
          const normalizedTasks = (result.tasks || []).map((task: Task) => ({
            ...task,
            due_date: task.due_date ? new Date(task.due_date) : undefined,
            completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
            created_at: new Date(task.created_at),
          }));
          setFilteredTasks(normalizedTasks);
        }
      } catch (error) {
        console.error('Filter error:', error);
      }
    }

    applyFilter();
  }, [taskFilter, selectedGroupUuid, userUuid, searchQuery]);

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    setIsSearching(true);

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(async () => {
      try {
        const result = await searchActiveDashboardTasksAction(
          userUuid,
          searchQuery,
          selectedGroupUuid,
          taskFilter
        );

        if (result.success) {
          const normalizedTasks = (result.tasks || []).map((task: Task) => ({
            ...task,
            due_date: task.due_date ? new Date(task.due_date) : undefined,
            completed_at: task.completed_at ? new Date(task.completed_at) : undefined,
            created_at: new Date(task.created_at),
          }));
          setFilteredTasks(normalizedTasks);
        } else {
          console.error('Search failed:', result.error);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, userUuid, selectedGroupUuid, taskFilter, activeTasks]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupUuid) return null;
    return groups.find(group => group.group_uuid === selectedGroupUuid) || null;
  }, [groups, selectedGroupUuid]);

  const taskGroupSummary = useMemo(() => {
    if (selectedGroupUuid) {
      if (selectedGroup?.group_name) {
        return `Task will be created inside group "${selectedGroup.group_name}".`;
      }
      return 'Task will be created inside the selected group.';
    }
    return 'No group selected from dashboard. Task will not belong to a group.';
  }, [selectedGroup, selectedGroupUuid]);

  // Get last completed task for tamagotchi display
  const completedTasks = tasks.filter(t => t.completed_at);
  const lastCompletedTask = completedTasks.length > 0
    ? {
      title: completedTasks[0].title,
      completedAt: new Date(completedTasks[0].completed_at!)
    }
    : null;
  const getViewTasksHref = (status: 'completed' | 'cancelled') => {
    if (selectedGroupUuid) {
      const paramsObj = new URLSearchParams({ group: String(selectedGroupUuid), status });
      if (selectedGroup?.group_name) {
        paramsObj.set('groupName', selectedGroup.group_name);
      }
      return `/tasks/${userUuid}/completed?${paramsObj.toString()}`;
    }
    return `/tasks/${userUuid}/completed?status=${status}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">


      <div className="grid gap-2 sm:gap-4 md:gap-6 md:grid-cols-2 auto-rows-max">
        {/* Tamagotchi display section */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">My Tamagotchi</h2>
          <TamagotchiDisplay
            points={tamagotchiStats.happiness_score}
            level={tamagotchi?.level || 1}
            lastCompletedTask={lastCompletedTask}
            completedTasks={tamagotchiStats.completed_tasks}
            incompleteTasks={tamagotchiStats.incomplete_tasks}
            userColor={userColor}
          />
        </section>
        {/* To-do list section */}
        <section className="border rounded-lg p-6">
          <div className={`flex justify-between items-center mb-4 ${isCreateTaskOpen ? 'relative z-50' : ''}`}>
            <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
            <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="h-auto px-0 text-sm">
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogOverlay />
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                  <DialogDescription>
                    Add a task with a due date, priority, and assigned teammate.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
                    {taskGroupSummary}
                  </div>
                  {taskFormErrors.general && (
                    <p className="text-sm text-red-600">{taskFormErrors.general}</p>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="task-title-input">Task title</Label>
                    <Input
                      id="task-title-input"
                      value={taskTitle}
                      onChange={(e) => {
                        setTaskTitle(e.target.value);
                        if (taskFormErrors.title) {
                          setTaskFormErrors((prev) => ({ ...prev, title: undefined }));
                        }
                      }}
                      placeholder="e.g., Finish project outline"
                    />
                    {taskFormErrors.title && (
                      <p className="text-xs text-red-600">{taskFormErrors.title}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="task-description-input">Description</Label>
                    <Textarea
                      id="task-description-input"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      rows={4}
                      placeholder="Add extra details for this task"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="task-due-date">Due date</Label>
                    <Input
                      id="task-due-date"
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => {
                        setTaskDueDate(e.target.value);
                        if (taskFormErrors.dueDate) {
                          setTaskFormErrors((prev) => ({ ...prev, dueDate: undefined }));
                        }
                      }}
                    />
                    {taskFormErrors.dueDate && (
                      <p className="text-xs text-red-600">{taskFormErrors.dueDate}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="task-priority">Priority</Label>
                    <select
                      id="task-priority"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as '1' | '2' | '3')}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="1">High</option>
                      <option value="2">Medium</option>
                      <option value="3">Low</option>
                    </select>
                  </div>
                  {allowTaskAssigneeInput ? (
                    <div className="space-y-1">
                      <Label htmlFor="task-assignee-email">Assignee email (optional)</Label>
                      <Input
                        id="task-assignee-email"
                        type="email"
                        value={taskAssigneeEmail}
                        onChange={(e) => {
                          setTaskAssigneeEmail(e.target.value);
                          if (taskFormErrors.assigneeEmail) {
                            setTaskFormErrors((prev) => ({ ...prev, assigneeEmail: undefined }));
                          }
                        }}
                        placeholder="member@example.com"
                      />
                      {taskFormErrors.assigneeEmail ? (
                        <p className="text-xs text-red-600">{taskFormErrors.assigneeEmail}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Only members of this group can be assigned.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                      Select a group to assign tasks to other members. Without a group, the task will be assigned to you.
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateTaskOpen(false)}
                    disabled={isCreatingTask}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateTaskSubmit}
                    disabled={isCreatingTask}
                  >
                    {isCreatingTask ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
    <>
      {/* Tamagotchi display section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Tamagotchi</h2>
          <Link
            href={`/friends/${userUuid}/tamagotchis`}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
          >
            View Friend's Tamagotchis
          </Link>
        </div>
        <TamagotchiDisplay
          points={tamagotchiStats.happiness_score}
          level={tamagotchi?.level || 1}
          levelProgressMessage={levelInfo.progressMessage}
          lastCompletedTask={lastCompletedTask}
          completedTasks={tamagotchiStats.completed_tasks}
          incompleteTasks={tamagotchiStats.incomplete_tasks}
          userColor={userColor}
        />
      </section>


      {/* Friends section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Friends</h2>
          <div className="flex items-center gap-8">
            <Link
              href={`/friends/${userUuid}/requests`}
              className="text-sm text-indigo-600 hover:underline"
            >
              View Friendship Requests ({pendingCount})
            </Link>
            <Link
              href={`/friends/${userUuid}/add`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Add Friend
            </Link>
          </div>

          {activeTasks.length > 0 && (
            <TaskFilter selectedFilter={taskFilter} onFilterChange={setTaskFilter} />
          )}

          {activeTasks.length > 0 && (
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {activeTasks.length === 0 ? (
              <p className="text-gray-500">No tasks yet</p>
            ) : filteredTasks.length === 0 ? (
              <p className="text-gray-500">No tasks match your search.</p>
            ) : (
              filteredTasks.map(task => (
                <div
                  key={task.todo_uuid}
                  className={`flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border ${task.completed_at ? 'opacity-60 line-through' : ''
                    }`}
                >
                  <button
                    onClick={() => window.location.href = `/tasks/${userUuid}/edit/${task.todo_uuid}`}
                    className="flex-1 hover:opacity-75 transition-opacity text-left"
                  >
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-500">
                      Due {task.due_date?.toDateString()} • Priority: {task.priority}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCompleteTask(task.todo_uuid)}
                      className="px-4 py-2 rounded-xl font-medium transition-all duration-150 bg-indigo-500 hover:bg-indigo-600 text-white"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.todo_uuid)}
                      className="px-4 py-2 rounded-xl font-medium border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-right">
            <div className="relative inline-block" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Tasks
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-gray-200 z-10">
                  <Link
                    href={getViewTasksHref('completed')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    View Completed Tasks
                  </Link>
                  <Link
                    href={getViewTasksHref('cancelled')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    View Deleted Tasks
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Group section */}
        <section className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-4">My Groups</h2>
            <div style={{ zIndex: 1000 }}>
              <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="h-auto px-0 text-sm">
                    Create New Group
                  </Button>
                </DialogTrigger>
                <DialogOverlay />
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Name your new group and add members by email. You will be the group admin.
                    </DialogDescription>
                  </DialogHeader>
                  {groupFormErrors.general && (
                    <p className="text-sm text-red-600">{groupFormErrors.general}</p>
                  )}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="group-name-input">Group name</Label>
                      <Input
                        id="group-name-input"
                        value={groupName}
                        onChange={(e) => {
                          setGroupName(e.target.value);
                          if (groupFormErrors.groupName) {
                            setGroupFormErrors((prev) => ({ ...prev, groupName: undefined }));
                          }
                        }}
                        placeholder="e.g., ECE444 Project"
                      />
                      {groupFormErrors.groupName && (
                        <p className="text-xs text-red-600">{groupFormErrors.groupName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-member-email">Add member by email</Label>
                      <div className="flex gap-2">
                        <Input
                          id="group-member-email"
                          type="email"
                          value={pendingGroupEmail}
                          onChange={(e) => {
                            setPendingGroupEmail(e.target.value);
                            if (groupFormErrors.pendingEmail) {
                              setGroupFormErrors((prev) => ({ ...prev, pendingEmail: undefined }));
                            }
                          }}
                          placeholder="user@example.com"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleAddGroupMember}
                          disabled={isCheckingMember || !pendingGroupEmail.trim()}
                        >
                          {isCheckingMember ? 'Checking...' : 'Add'}
                        </Button>
                      </div>
                      {groupFormErrors.pendingEmail && (
                        <p className="text-xs text-red-600">{groupFormErrors.pendingEmail}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Members added</p>
                      {groupMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No new members added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {groupMembers.map((member) => (
                            <div
                              key={member.email}
                              className="flex items-center justify-between rounded-md border px-3 py-2"
                            >
                              <div>
                                <p className="font-medium">{member.label || member.email}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveGroupMember(member.email)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateGroupOpen(false)}
                      disabled={isCreatingGroup}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateGroupSubmit}
                      disabled={isCreatingGroup}
                    >
                      {isCreatingGroup ? 'Creating...' : 'Create Group'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

          </div>

          <FlashMessage message={message} kind={messageKind} onDismiss={resetFlash} />

          {groups.length === 0 ? (
            <p className="text-gray-500">You are not part of any groups yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map(group => {
                const selected = selectedGroupUuid === group.group_uuid;
                return (
                  <button
                    key={group.group_uuid}
                    type="button"
                    onClick={() => handleSelectGroup(group.group_uuid)}
                    className={`text-left px-4 py-3 border rounded-lg transition-all ${selected
                      ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                      : 'border-gray-200 hover:border-indigo-300'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-900">{group.group_name}</span>
                      {selected && (
                        <span className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {selectedGroup && (
            <div className="mt-4 space-y-3">
              <Link
                href={`/groups/${userUuid}/${selectedGroup.group_uuid}`}
                className="inline-flex w-full justify-center rounded-md border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                View Group Members
              </Link>
              <button
                onClick={() => handleDeleteGroupClick(String(selectedGroup.group_uuid))}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Delete Group
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Delete group confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Group</h2>
            <p className="text-gray-700 mb-4">
              This action cannot be undone. All tasks in this group will be cancelled and the group will be permanently deleted.
            </p>
            {deleteGroupUuid && groups.find((g) => String(g.group_uuid) === deleteGroupUuid) && (
              <p className="text-gray-700 font-semibold mb-4">
                Type <span className="bg-gray-100 px-2 py-1 rounded">{groups.find((g) => String(g.group_uuid) === deleteGroupUuid)?.group_name}</span> to confirm:
              </p>
            )}
            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              placeholder={deleteGroupUuid && groups.find((g) => String(g.group_uuid) === deleteGroupUuid) ? `Enter "${groups.find((g) => String(g.group_uuid) === deleteGroupUuid)?.group_name}" to confirm` : 'Confirm'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              disabled={isDeleting}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmInput('');
                  setDeleteGroupUuid(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={
                  isDeleting ||
                  (deleteGroupUuid && groups.find((g) => String(g.group_uuid) === deleteGroupUuid)
                    ? deleteConfirmInput.trim() !== groups.find((g) => String(g.group_uuid) === deleteGroupUuid)!.group_name.trim()
                    : true)
                }
                className="flex-1 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isDeleting ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
