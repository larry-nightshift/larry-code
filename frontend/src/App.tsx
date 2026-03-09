import { useState } from 'react';
import './App.css';
import { FocusCard } from './components/FocusCard';
import { NotesList } from './components/NotesList';
import { TasksList } from './components/TasksList';
import { WeatherWidget } from './components/WeatherWidget';
import { UpcomingWidget } from './components/UpcomingWidget';
import { TimerWidget } from './components/TimerWidget';

type Feature = 'focus' | 'notes' | 'tasks' | 'dashboard';

function App() {
  const [currentFeature, setCurrentFeature] = useState<Feature>('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Personal Now Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentFeature('dashboard')}
                className={`px-4 py-2 rounded ${
                  currentFeature === 'dashboard'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentFeature('focus')}
                className={`px-4 py-2 rounded ${
                  currentFeature === 'focus'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Focus
              </button>
              <button
                onClick={() => setCurrentFeature('notes')}
                className={`px-4 py-2 rounded ${
                  currentFeature === 'notes'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setCurrentFeature('tasks')}
                className={`px-4 py-2 rounded ${
                  currentFeature === 'tasks'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tasks
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentFeature === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <FocusCard />
              <TasksList />
            </div>
            <div className="space-y-6">
              <TimerWidget />
              <WeatherWidget />
            </div>
          </div>
        )}
        {currentFeature === 'dashboard' && (
          <div className="mt-6">
            <UpcomingWidget />
          </div>
        )}
        {currentFeature === 'focus' && <FocusCard />}
        {currentFeature === 'notes' && <NotesList />}
        {currentFeature === 'tasks' && <TasksList />}
      </main>
    </div>
  );
}

export default App;
