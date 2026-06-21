import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Navigation from './components/Navigation';

const Home = lazy(() => import('./components/Home'));
const BlogList = lazy(() => import('./components/BlogList'));
const BlogPost = lazy(() => import('./components/BlogPost'));
const Books = lazy(() => import('./components/Books'));

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="min-h-screen">
          <Navigation />
          <Suspense fallback={<div className="min-h-screen bg-white pt-32" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/books" element={<Books />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;