'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import type { Task } from '@/app/types/task.type';
import {
  unresolveTaskAction,
  deleteTaskPermanentlyAction,
  recoverTaskAction,
} from './actions';
import { updateTaskAction } from '../edit/actions';

type TaskDetailModalProps = {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  userUuid: string;
  status: 'completed' | 'cancelled';
};

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  userUuid,
  status,
}: TaskDetailModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  );
  const [priority, setPriority] = useState<string>(String(task.priority));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    // Reset form to original task data
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(
      task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
    );
    setPriority(String(task.priority));
    setError('');
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await updateTaskAction({
        taskUuid: String(task.todo_uuid),
        title,
        description,
        dueDate,
        priority,
      });

      if (!result.success) {
        setError(result.error || 'Failed to update task.');
        setIsLoading(false);
        return;
      }

      router.refresh();
      handleClose();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task. Please try again.');
      setIsLoading(false);
    }
  };

  const handleUnresolve = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await unresolveTaskAction(String(task.todo_uuid));
      if (!result.success) {
        setError(result.error || 'Failed to unresolve task');
        setIsLoading(false);
        return;
      }
      router.refresh();
      handleClose();
    } catch (err) {
      console.error('Failed to unresolve task:', err);
      setError('Failed to unresolve task. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this task?')) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await deleteTaskPermanentlyAction(String(task.todo_uuid));
      if (!result.success) {
        setError(result.error || 'Failed to delete task');
        setIsLoading(false);
        return;
      }
      router.refresh();
      handleClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Failed to delete task. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRecover = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await recoverTaskAction(String(task.todo_uuid));
      if (!result.success) {
        setError(result.error || 'Failed to recover task');
        setIsLoading(false);
        return;
      }
      router.refresh();
      handleClose();
    } catch (err) {
      console.error('Failed to recover task:', err);
      setError('Failed to recover task. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { margin: 2 } }}>
      <DialogTitle>Task Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={isLoading}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            disabled={isLoading}
          />

          <TextField
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
            disabled={isLoading}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth disabled={isLoading}>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} label="Priority">
              <MenuItem value="1">High</MenuItem>
              <MenuItem value="2">Medium</MenuItem>
              <MenuItem value="3">Low</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ gap: 1, p: 2 }}>
        {/* Action buttons based on status */}
        {status === 'completed' && (
          <>
            <Button
              onClick={handleUnresolve}
              disabled={isLoading}
              color="warning"
              variant="text"
            >
              {isLoading ? 'Unresolving...' : 'Unresolve'}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              color="error"
              variant="text"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        )}

        {status === 'cancelled' && (
          <Button
            onClick={handleRecover}
            disabled={isLoading}
            color="success"
            variant="text"
          >
            {isLoading ? 'Recovering...' : 'Recover'}
          </Button>
        )}

        {/* Common buttons */}
        <Button onClick={handleClose} disabled={isLoading}>
          Close
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          variant="contained"
        >
          {isLoading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
