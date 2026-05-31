import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { menuApi, categoryApi } from '../../api/menu.api';
import type { Menu, Category } from '../../types';
import MenuCard from '../../components/menu/MenuCard';
import MenuDetailModal from '../../components/menu/MenuDetailModal';
import './MenuPage.css';

const MenuPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [serviceType, setServiceType] = useState<'DELIVERY'|'DINE_IN'|'TAKEAWAY'>('DELIVERY');

  const BUSINESS_ID = businessId || import.meta.env.VITE_BUSINESS_ID || 'biz-mock-001';

  useEffect(() => {
    if (!BUSINESS_ID) return;
    fetchData();
  }, [BUSINESS_ID]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuData, catData] = await Promise.all([
        menuApi.getByBusiness(BUSINESS_ID),
        categoryApi.getByBusiness(BUSINESS_ID),
      ]);
      const items = Array.isArray(menuData) ? menuData : (menuData as any).data ?? [];
      setMenus(items);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDescendants = (catId: string): string[] => {
    const ids = [catId];
    const cat = categories.find(c => c.id === catId);
    // Support both 'children' and 'childrens' based on what backend returns
    const children = cat?.children || (cat as any)?.childrens || [];
    children.forEach((child: Category) => ids.push(child.id));
    return ids;
  };

  const filteredMenus = menus.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.description?.toLowerCase().includes(searchQuery.toLowerCase());
                          
    if (selectedCategory === 'all') return matchesSearch;

    const validCatIds = getCategoryDescendants(selectedCategory);
    const itemCatId = m.categoryId || m.category?.id || '';
    const matchesCategory = validCatIds.includes(itemCatId);

    return matchesCategory && matchesSearch;
  });

  const sortedMenus = [...filteredMenus].sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="menu-page">
      <div className="menu-layout-wrap">
        
        {/* Sidebar Navigation */}
        <aside className="menu-sidebar">
          <div className="menu-sidebar__heading">
            <h2 className="menu-sidebar__title">Menu</h2>
            <p className="menu-sidebar__sub">Explore our categories</p>
          </div>
          <nav className="menu-sidebar__nav">
            <button
              className={`menu-sidebar__link ${selectedCategory === 'all' ? 'menu-sidebar__link--active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="menu-sidebar__icon">🍽️</span> All Dishes
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`menu-sidebar__link ${selectedCategory === cat.id ? 'menu-sidebar__link--active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="menu-sidebar__icon">{cat.icon || '🍲'}</span> {cat.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="menu-main">
          {/* Top Bar: Service Toggle & Location */}
          <div className="service-toggle-bar">
            <div className="service-toggle">
              {(['DELIVERY', 'DINE_IN', 'TAKEAWAY'] as const).map(type => (
                <button
                  key={type}
                  className={`service-toggle__btn ${serviceType === type ? 'service-toggle__btn--active' : ''}`}
                  onClick={() => setServiceType(type)}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
            {serviceType === 'DELIVERY' && (
              <div className="service-location">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Delivering to <span>Current Location</span>
              </div>
            )}
          </div>

          {/* Hero Banner */}
          <div className="menu-hero-banner">
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80" alt="Food Banner" />
            <div className="menu-hero-banner__gradient" />
            <div className="menu-hero-banner__text">
              <h1 className="menu-hero-banner__title">Savor the Extraordinary</h1>
              <p className="menu-hero-banner__sub">Handcrafted dishes made from locally sourced, fresh ingredients.</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="menu-filter-row">
            <div className="menu-search-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                className="menu-search-input"
                placeholder="Search for dishes, ingredients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="menu-sort-wrap">
              <select 
                className="menu-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="default">Default Sorting</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Menu Grid */}
          {loading ? (
            <div className="menu-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-img"></div>
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-line--title"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line skeleton-line--short"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedMenus.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h2>No dishes found</h2>
              <p>We couldn't find anything matching your search. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <p className="menu-count">{sortedMenus.length} items available</p>
              <div className="menu-grid">
                {sortedMenus.map(menu => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    onClick={() => setSelectedMenu(menu)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        <button className="mobile-bottom-nav__item mobile-bottom-nav__item--active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
          Home
        </button>
        <button className="mobile-bottom-nav__item" onClick={() => document.querySelector('.menu-sidebar')?.scrollIntoView()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Categories
        </button>
      </div>

      {selectedMenu && (
        <MenuDetailModal menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
      )}
    </div>
  );
};

export default MenuPage;
