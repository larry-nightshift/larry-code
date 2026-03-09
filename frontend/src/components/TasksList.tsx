import { useState, useEffect } from 'react';
import { tasksAPI } from '../lib/api';
import type { Task } from '../lib/api';
import { Button, Card, CardHeader, Input, Badge, Alert } from './ui';

export function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksAPI.list();
      setTasks(data || []);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTask.trim()) return;

    try {
      setLoading(true);
      await tasksAPI.create(newTask, newDueDate || undefined);
      setNewTask('');
      setNewDueDate('');
      await loadTasks();
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus =
        task.status === 'TODO' ? 'DOING' : task.status === 'DOING' ? 'DONE' : 'TODO';
      await tasksAPI.update(task.id, { status: newStatus });
      await loadTasks();
    } catch (err) {
      setError('Failed to update task');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tasksAPI.delete(id);
      await loadTasks();
    } catch (err) {
      setError('Failed to delete task');
      console.error(err);
    }
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const doingTasks = tasks.filter((t) => t.status === 'DOING');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <Card variant="gradient" padding="md" className="animate-fade-in">
      <CardHeader title="Tasks" />

      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)} className="mb-2">
          {error}
        </Alert>
      )}

      {/* Add task form */}
      <Card variant="outlined" padding="sm" className="mb-3">
        <div className="space-y-1.5">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
          <Button
            onClick={handleCreate}
            disabled={loading || !newTask.trim()}
            size="sm"
            fullWidth
          >
            Add Task
          </Button>
        </div>
      </Card>

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary-400 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          <TaskSection
            title="To Do"
            tasks={todoTasks}
            onToggle={handleToggleStatus}
            onDelete={handleDelete}
          />
          <TaskSection
            title="In Progress"
            tasks={doingTasks}
            onToggle={handleToggleStatus}
            onDelete={handleDelete}
          />
          <TaskSection
            title="Done"
            tasks={doneTasks}
            onToggle={handleToggleStatus}
            onDelete={handleDelete}
          />

          {tasks.length === 0 && (
            <p className="text-center text-surface-500 text-caption py-4">
              No tasks yet. Create one above!
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function TaskSection({
  title,
  tasks,
  onToggle,
  onDelete,
}: {
  title: string;
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <h3 className="text-caption font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
        {title} ({tasks.length})
      </h3>
      <div className="space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: number) => void;
}) {
  const statusBadge: Record<string, { variant: 'default' | 'warning' | 'success'; label: string }> = {
    TODO: { variant: 'default', label: 'To Do' },
    DOING: { variant: 'warning', label: 'In Progress' },
    DONE: { variant: 'success', label: 'Done' },
  };

  const badge = statusBadge[task.status];

  return (
    <Card variant="outlined" padding="sm" hoverable className="group">
      <div className="flex justify-between items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <p
              className={`font-medium text-body truncate ${
                task.status === 'DONE' ? 'line-through text-surface-500' : 'text-surface-100'
              }`}
            >
              {task.text}
            </p>
            <Badge variant={badge.variant} size="sm">
              {badge.label}
            </Badge>
          </div>
          {task.due_date && (
            <p className="text-small text-surface-500">Due: {task.due_date}</p>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onToggle(task)}>
            {task.status === 'TODO'
              ? 'Start'
              : task.status === 'DOING'
                ? 'Done'
                : 'Reopen'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(task.id)}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
