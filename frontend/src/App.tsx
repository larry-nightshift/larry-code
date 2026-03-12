import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { ContactsList, ContactDetail, Reminders } from './components/crm';
import ExercisesPage from './components/workouts/ExercisesPage';
import RoutinesPage from './components/workouts/RoutinesPage';
import WorkoutStartPage from './components/workouts/WorkoutStartPage';
import WorkoutSessionPage from './components/workouts/WorkoutSessionPage';
import WorkoutDetailPage from './components/workouts/WorkoutDetailPage';
import HistoryPage as WorkoutHistoryPage from './components/workouts/HistoryPage';
import PRsPage from './components/workouts/PRsPage';
import ExerciseProgressPage from './components/workouts/ExerciseProgressPage';
import { InventoryDashboard, ItemsList, ItemForm, ItemDetailPage, LocationsPage } from './components/inventory';

type Feature = 'focus' | 'notes' | 'tasks' | 'dashboard' | 'recipes' | 'grocery' | 'habits' | 'maintenance' | 'posts' | 'crm' | 'workouts' | 'inventory';

const featureRoutes: Record<Feature, string> = {
  dashboard: '/',
  focus: '/focus',
  notes: '/notes',
  tasks: '/tasks',
  recipes: '/recipes',
  grocery: '/grocery',
  habits: '/habits',
  maintenance: '/maintenance/due',
  posts: '/posts',
  crm: '/crm/contacts',
  workouts: '/workouts/start',
  inventory: '/inventory',
};

function AppContent({ currentFeature, setCurrentFeature }: { currentFeature: Feature; setCurrentFeature: (f: Feature) => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleFeatureChange = (feature: Feature) => {
      setCurrentFeature(feature);
      navigate(featureRoutes[feature]);
    };

    // This is used by the Layout/Sidebar
    (window as any).__appNavigate = handleFeatureChange;
  }, [navigate, setCurrentFeature]);

  // Update feature based on current route
  useEffect(() => {
    for (const [feature, route] of Object.entries(featureRoutes)) {
      if (location.pathname === route || location.pathname.startsWith(route + '/')) {
        setCurrentFeature(feature as Feature);
        break;
      }
    }
  }, [location.pathname, setCurrentFeature]);

  const handleFeatureChange = (feature: Feature) => {
    setCurrentFeature(feature);
    navigate(featureRoutes[feature]);
  };

  return (
    <Layout currentFeature={currentFeature} onFeatureChange={handleFeatureChange}>
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
          <Route path="/crm/contacts" element={<ContactsList />} />
          <Route path="/crm/contact/:id" element={<ContactDetail />} />
          <Route path="/crm/reminders" element={<Reminders />} />
          <Route path="/workouts/start" element={<WorkoutStartPage />} />
          <Route path="/workouts/exercises" element={<ExercisesPage />} />
          <Route path="/workouts/routines" element={<RoutinesPage />} />
          <Route path="/workouts/session/:id" element={<WorkoutSessionPage />} />
          <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
          <Route path="/workouts/history" element={<WorkoutHistoryPage />} />
          <Route path="/workouts/prs" element={<PRsPage />} />
          <Route path="/workouts/progress/:exerciseId" element={<ExerciseProgressPage />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/inventory/items" element={<ItemsList />} />
          <Route path="/inventory/items/new" element={<ItemForm />} />
          <Route path="/inventory/items/:id" element={<ItemDetail />} />
          <Route path="/inventory/items/:id/edit" element={<ItemForm />} />
          <Route path="/inventory/locations" element={<LocationsList />} />
        </Routes>
      </Layout>
  );
}

function App() {
  const [currentFeature, setCurrentFeature] = useState<Feature>('dashboard');

  return (
    <BrowserRouter>
      <AppContent currentFeature={currentFeature} setCurrentFeature={setCurrentFeature} />
    </BrowserRouter>
  );
}

export default App;
