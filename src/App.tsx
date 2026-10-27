import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Navigation from './components/Navigation';
import { trackPageView } from './utils/analytics';

const Home = lazy(() => import('./components/Home'));
const BlogList = lazy(() => import('./components/BlogList'));
const BlogPost = lazy(() => import('./components/BlogPost'));
const Books = lazy(() => import('./components/Books'));
const Services = lazy(() => import('./components/Services'));
const Products = lazy(() => import('./components/Products'));

// One page view per route change. The delay lets lazy pages mount and set document.title first.
function PageViewTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    const timer = setTimeout(() => trackPageView(pathname), 600);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <PageViewTracker />
        <div className="min-h-screen">
          <Navigation />
          <Suspense fallback={<div className="min-h-screen bg-white pt-32" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/books" element={<Books />} />
              <Route path="/services" element={<Services />} />
              <Route path="/products" element={<Products />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;