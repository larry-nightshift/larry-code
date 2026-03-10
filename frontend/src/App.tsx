import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { FocusCard } from './components/FocusCard';
import { NotesList } from './components/NotesList';
import { TasksList } from './components/TasksList';
import { WeatherWidget } from './components/WeatherWidget';
import { UpcomingWidget } from './components/UpcomingWidget';
import { TimerWidget } from './components/TimerWidget';
import RecipesList from './components/recipes/RecipesList';
import GroceryListsPage from './components/grocery/GroceryListsPage';
import { TodayPage as HabitsTodayPage } from './components/habits/TodayPage';
import { HabitDetailPage } from './components/habits/HabitDetailPage';
import { InsightsPage as HabitsInsightsPage } from './components/habits/InsightsPage';
import { DuePage, AssetsPage, TaskDetailPage, HistoryPage } from './components/maintenance';
import { PostsList } from './components/posts';

type Feature = 'focus' | 'notes' | 'tasks' | 'dashboard' | 'recipes' | 'grocery' | 'habits' | 'maintenance' | 'posts';

function App() {
  const [currentFeature, setCurrentFeature] = useState<Feature>('dashboard');

  return (
    <BrowserRouter>
      <Layout currentFeature={currentFeature} onFeatureChange={setCurrentFeature}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2 space-y-3">
                    <FocusCard />
                    <TasksList />
                  </div>
                  <div className="space-y-3">
                    <TimerWidget />
                    <WeatherWidget />
                  </div>
                </div>
                <div className="mt-3">
                  <UpcomingWidget />
                </div>
              </>
            }
          />
          <Route path="/focus" element={<FocusCard />} />
          <Route path="/notes" element={<NotesList />} />
          <Route path="/tasks" element={<TasksList />} />
          <Route path="/recipes" element={<RecipesList />} />
          <Route path="/grocery" element={<GroceryListsPage />} />
          <Route path="/habits" element={<HabitsTodayPage />} />
          <Route path="/habits/insights" element={<HabitsInsightsPage />} />
          <Route path="/habits/:id" element={<HabitDetailPage />} />
          <Route path="/maintenance/due" element={<DuePage />} />
          <Route path="/maintenance/assets" element={<AssetsPage />} />
          <Route path="/maintenance/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/maintenance/history" element={<HistoryPage />} />
          <Route path="/posts" element={<PostsList />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
