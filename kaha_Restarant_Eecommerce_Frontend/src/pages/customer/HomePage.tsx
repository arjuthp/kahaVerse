import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { menuApi } from '../../api/menu.api';
import type { Menu } from '../../types';
import MenuCard from '../../components/menu/MenuCard';
import MenuDetailModal from '../../components/menu/MenuDetailModal';
import './HomePage.css';

const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || 'biz-mock-001';

const features = [
  {
    icon: '🍽️',
    title: 'Chef-crafted Menu',
    desc: 'Explore seasonal, locally sourced dishes curated by our award-winning chefs.',
  },
  {
    icon: '📍',
    title: 'Live Tracking',
    desc: 'Know exactly when your food will arrive with real-time delivery tracking.',
  },
  {
    icon: '🛡️',
    title: 'Secure Checkout',
    desc: 'Pay safely and securely online, or choose cash on delivery for convenience.',
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedDishes();
  }, []);

  const fetchFeaturedDishes = async () => {
    try {
      setLoading(true);
      const items = await menuApi.getByBusiness(BUSINESS_ID);
      // Select the first 4 available products or signature items
      const filtered = items.filter(item => item.isAvailable).slice(0, 4);
      setFeaturedItems(filtered);
    } catch (err) {
      console.error('Failed to fetch home products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      
      {/* ====== HERO ====== */}
      <section className="hero-section">
        <div className="hero-bg">
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80" alt="Restaurant interior" />
        </div>
        <div className="hero-overlay" />
        
        <div className="hero-content container">
          <h1>Experience <span>Extraordinary</span> Flavours</h1>
          <p>
            Welcome to KAHA Eats. We believe in serving food that not only tastes incredible but makes you feel great. Reserve a table or order delivery to your doorstep today.
          </p>
          
          <div className="hero-cta">
            <button
              className="hero-btn hero-btn--primary"
              onClick={() => navigate(`/menu/${BUSINESS_ID}`)}
            >
              Order Now
            </button>
            <button
              className="hero-btn hero-btn--secondary"
              onClick={() => document.getElementById('featured-dishes')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Featured Dishes
            </button>
          </div>
        </div>
      </section>

      {/* ====== SEEDED PRODUCTS FROM DATABASE ====== */}
      <section id="featured-dishes" className="featured-products-section" style={{ padding: '80px 0', background: 'var(--surface-lowest)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="section-subtitle" style={{ color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px' }}>Freshly Prepared</span>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', color: 'var(--on-surface)', marginTop: '8px' }}>Featured Culinary Creations</h2>
            <p style={{ color: 'var(--secondary)', fontSize: '16px', maxWidth: '600px', margin: '8px auto 0' }}>
              Handpicked customer favourites fetched directly from our kitchen database.
            </p>
          </div>

          {loading ? (
            <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-card" style={{ height: '380px', borderRadius: '16px', background: 'var(--surface-container)' }}></div>
              ))}
            </div>
          ) : featuredItems.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="empty-icon" style={{ fontSize: '48px' }}>🍲</div>
              <h3 style={{ marginTop: '16px', color: 'var(--on-surface)' }}>No dishes available right now</h3>
              <p style={{ color: 'var(--slate-gray)' }}>Our chefs are updating the menu. Check back shortly!</p>
            </div>
          ) : (
            <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {featuredItems.map(menu => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  onClick={() => setSelectedMenu(menu)}
                />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to={`/menu/${BUSINESS_ID}`} className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '30px' }}>
              View Complete Menu ➔
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="features-section" style={{ background: 'var(--surface-container-low)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', color: 'var(--on-surface)' }}>Why Choose Us</h2>
            <p style={{ color: 'var(--secondary)', fontSize: '16px', maxWidth: '600px', margin: '8px auto 0' }}>We are committed to providing the best dining experience, whether you are eating in our restaurant or ordering from the comfort of your home.</p>
          </div>
          
          <div className="features-grid">
            {features.map((feat) => (
              <div key={feat.title} className="feature-card">
                <div className="feature-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== BOTTOM CTA ====== */}
      <section style={{ padding: '80px 0', background: 'var(--surface-container)', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', marginBottom: '16px', color: 'var(--on-surface)' }}>Ready to Taste the Difference?</h2>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '32px' }}>Join thousands of satisfied customers and discover your new favorite meal today.</p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to={`/menu/${BUSINESS_ID}`} className="btn btn-primary btn-lg" style={{ padding: '16px 32px' }}>
              Explore Menu
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg" style={{ padding: '16px 32px' }}>
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {selectedMenu && (
        <MenuDetailModal menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
      )}
      
    </div>
  );
};

export default HomePage;
