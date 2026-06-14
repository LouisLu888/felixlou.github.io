import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) => 
    `transition-colors ${isActive(path) 
      ? 'text-amber-600 font-medium' 
      : 'text-slate-600 hover:text-amber-600'
    }`;

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="font-bold text-xl text-slate-800 hover:text-amber-600 transition-colors">
            Jiabin Lu
          </Link>
                                <div className="hidden md:flex items-center space-x-8">
                        <Link to="/blog" className={linkClass('/blog')}>
                          {t('nav.blog')}
                        </Link>
                        {/* <Link to="/books" className={linkClass('/books')}>
                          {t('nav.books')}
                        </Link> */}
                        
                        {/* Language Switcher */}
                        <div className="relative group">
                          <button className="flex items-center space-x-1 text-slate-600 hover:text-amber-600 transition-colors">
                            <Globe className="w-4 h-4" />
                            <span className="text-sm">{language === 'en' ? 'EN' : '中文'}</span>
                          </button>
                          <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <button
                              onClick={() => setLanguage('en')}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg ${
                                language === 'en' ? 'text-amber-600 font-medium' : 'text-slate-700'
                              }`}
                            >
                              {t('language.english')}
                            </button>
                            <button
                              onClick={() => setLanguage('zh')}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg ${
                                language === 'zh' ? 'text-amber-600 font-medium' : 'text-slate-700'
                              }`}
                            >
                              {t('language.chinese')}
                            </button>
                          </div>
                        </div>
                      </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden" ref={mobileMenuRef}>
            <button 
              onClick={toggleMobileMenu}
              className="text-slate-600 hover:text-amber-600 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Mobile menu panel */}
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg">
                <div className="px-6 py-4 space-y-4">
                  <Link to="/blog" className={`block py-2 ${linkClass('/blog')}`}>
                    {t('nav.blog')}
                  </Link>
                  {/* <Link to="/books" className={`block py-2 ${linkClass('/books')}`}>
                    {t('nav.books')}
                  </Link> */}
                  
                  {/* Mobile Language Switcher */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-600 flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        Language:
                      </span>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`text-sm px-3 py-1 rounded ${
                          language === 'en' ? 'bg-amber-100 text-amber-600 font-medium' : 'text-slate-600 hover:text-amber-600'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => setLanguage('zh')}
                        className={`text-sm px-3 py-1 rounded ${
                          language === 'zh' ? 'bg-amber-100 text-amber-600 font-medium' : 'text-slate-600 hover:text-amber-600'
                        }`}
                      >
                        中文
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 