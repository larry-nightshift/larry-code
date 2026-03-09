import { useState, useEffect } from 'react';
import { tasksAPI } from '../lib/api';
import type { Task } from '../lib/api';

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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Tasks</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 border border-gray-300 rounded-lg">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="New task"
          className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreate}
          disabled={loading || !newTask.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Add Task
        </button>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="text-center text-gray-400">Loading tasks...</div>
      ) : (
        <div>
          {todoTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                To Do ({todoTasks.length})
              </h3>
              <div className="space-y-2">
                {todoTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {doingTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                In Progress ({doingTasks.length})
              </h3>
              <div className="space-y-2">
                {doingTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                Done ({doneTasks.length})
              </h3>
              <div className="space-y-2">
                {doneTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-center text-gray-400">
              No tasks yet. Create one above!
            </p>
          )}
        </div>
      )}
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
  const statusColors = {
    TODO: 'bg-gray-100',
    DOING: 'bg-yellow-100',
    DONE: 'bg-green-100',
  };

  return (
    <div className={`p-3 border border-gray-300 rounded-lg ${statusColors[task.status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p
            className={`font-semibold ${
              task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'
            }`}
          >
            {task.text}
          </p>
          {task.due_date && (
            <p className="text-xs text-gray-600 mt-1">Due: {task.due_date}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToggle(task)}
            className="px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded hover:bg-blue-300"
          >
            {task.status === 'TODO'
              ? 'Start'
              : task.status === 'DOING'
                ? 'Done'
                : 'Reopen'}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="px-2 py-1 text-xs bg-red-200 text-red-700 rounded hover:bg-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
