import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { FocusCard } from './components/FocusCard';
import { NotesList } from './components/NotesList';
import { TasksList } from './components/TasksList';
import { WeatherWidget } from './components/WeatherWidget';
import { UpcomingWidget } from './components/UpcomingWidget';
import { TimerWidget } from './components/TimerWidget';
import RecipesList from './components/recipes/RecipesList';
import GroceryListsPage from './components/grocery/GroceryListsPage';

type Feature = 'focus' | 'notes' | 'tasks' | 'dashboard' | 'recipes' | 'grocery';

function App() {
  const [currentFeature, setCurrentFeature] = useState<Feature>('dashboard');

  return (
    <Layout currentFeature={currentFeature} onFeatureChange={setCurrentFeature}>
      {currentFeature === 'dashboard' && (
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
      )}
      {currentFeature === 'focus' && <FocusCard />}
      {currentFeature === 'notes' && <NotesList />}
      {currentFeature === 'tasks' && <TasksList />}
      {currentFeature === 'recipes' && <RecipesList />}
      {currentFeature === 'grocery' && <GroceryListsPage />}
    </Layout>
  );
}

export default App;
