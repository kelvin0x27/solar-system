import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '@/components/layout/Navbar';
import HomePage from '@/pages/HomePage';
import ApodPage from '@/pages/ApodPage';
import MarsPage from '@/pages/MarsPage';
import AsteroidsPage from '@/pages/AsteroidsPage';
import NewsPage from '@/pages/NewsPage';
import TimelinePage from '@/pages/TimelinePage';
import AboveMePage from '@/pages/AboveMePage';
import ExoplanetPage from '@/pages/ExoplanetPage';
import SwarmPage from '@/pages/SwarmPage';
import BlackHolePage from '@/pages/BlackHolePage';
import AsteroidImpactPage from '@/pages/AsteroidImpactPage';
import IssViewPage from '@/pages/IssViewPage';
import MarsRoverPathPage from '@/pages/MarsRoverPathPage';
import MoonExplorerPage from '@/pages/MoonExplorerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className='w-full h-full bg-void relative'>
          <Navbar />
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/apod' element={<ApodPage />} />
            <Route path='/mars' element={<MarsPage />} />
            <Route path='/asteroids' element={<AsteroidsPage />} />
            <Route path='/overhead' element={<AboveMePage />} />
            <Route path='/exoplanets' element={<ExoplanetPage />} />
            <Route path='/swarm' element={<SwarmPage />} />
            <Route path='/blackhole' element={<BlackHolePage />} />
            <Route path='/impact' element={<AsteroidImpactPage />} />
            <Route path='/iss-view' element={<IssViewPage />} />
            <Route path='/mars-map' element={<MarsRoverPathPage />} />
            <Route path='/moon' element={<MoonExplorerPage />} />
            <Route path='/news' element={<NewsPage />} />
            <Route path='/timeline' element={<TimelinePage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
