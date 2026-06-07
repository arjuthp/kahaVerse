import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { menuApi, categoryApi } from '../../api/menu.api';
import type { Menu, Category } from '../../types';
import MenuCard from '../../components/menu/MenuCard';
import MenuDetailModal from '../../components/menu/MenuDetailModal';
import { getImageUrl } from '../../utils/helpers';
import './HomePage.css';

const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || 'biz-mock-001';

const BENEFITS = [
  {
    icon: '🥬',
    title: '100% Organic',
    subtitle: 'Locally Sourced',
    desc: 'Direct partnerships with organic farmers in Kathmandu Valley ensure absolute farm-to-table freshness.'
  },
  {
    icon: '🛵',
    title: 'Express Delivery',
    subtitle: 'Under 30 Minutes',
    desc: 'Our dedicated riders deliver hot, fresh meals to your doorstep with real-time GPS tracking.'
  },
  {
    icon: '👨‍🍳',
    title: 'Chef-Crafted',
    subtitle: 'Generations of Taste',
    desc: 'Traditional recipes curated and perfected by our master chefs for a modern fine-dining experience.'
  },
  {
    icon: '💎',
    title: 'KAHA Coins',
    subtitle: 'Loyalty Rewards',
    desc: 'Earn coins on every order and unlock exclusive dining discounts and special member-only items.'
  }
];

const REVIEWS = [
  {
    name: 'Aayush Shrestha',
    role: 'Tech Lead, Kathmandu',
    avatar: 'AS',
    text: 'The Margherita Pizza is out of this world. Clean ingredients, sourdough base, and arriving piping hot. KAHA has raised the standard for delivery services in Nepal.',
    rating: 5
  },
  {
    name: 'Sujata Thapa',
    role: 'Nutritionist',
    avatar: 'ST',
    text: 'Finding healthy, organic food options that deliver on taste used to be a struggle. KAHA\'s organic bowls and juices are now my daily go-to lunch. Brilliant concept!',
    rating: 5
  },
  {
    name: 'Prabal Gurung',
    role: 'Regular Patron',
    avatar: 'PG',
    text: 'Every dish feels like it was cooked for family. The detail, packaging quality, and warm customer care are unmatched. The Kaahan coins program is a great bonus!',
    rating: 5
  }
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSub, setEmailSub] = useState('');
  const [subbed, setSubbed] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuData, catData] = await Promise.all([
        menuApi.getByBusiness(BUSINESS_ID),
        categoryApi.getByBusiness(BUSINESS_ID),
      ]);
      const items = Array.isArray(menuData) ? menuData : (menuData as any).data ?? [];
      setMenus(items.filter((i: Menu) => i.isAvailable));
      setCategories(catData);
    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get curated highlights (signatures first, backfilled with others to always show exactly 4 items)
  const signatures = menus.filter(m => m.isSignature);
  const nonSignatures = menus.filter(m => !m.isSignature);
  const featuredDishes = [...signatures, ...nonSignatures].slice(0, 4);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailSub.trim()) {
      setSubbed(true);
      setEmailSub('');
    }
  };

  return (
    <div className="homepage-redesign">
      
      {/* ── HERO HEADER (SPLIT ARTISAN GRID) ── */}
      <section className="hero-split">
        <div className="container hero-split__grid">
          <div className="hero-split__left animate-fade-in">
            <div className="hero-split__badge">
              <span className="badge-glow" />
              🌿 Organic · Local · Chef-Crafted
            </div>
            <h1 className="hero-split__title">
              Taste the <span>Soul</span> of <br />
              Nepali Gastronomy
            </h1>
            <p className="hero-split__description">
              Savor premium meals handcrafted daily using organic, locally-sourced ingredients. 
              Delivered hot and fresh from our kitchen to your doorstep.
            </p>
            <div className="hero-split__actions">
              <button 
                className="hero-split__btn hero-split__btn--primary"
                onClick={() => document.getElementById('curated-showcase')?.scrollIntoView({ behavior: 'smooth' })}
              >
                🍽 Explore Specials
              </button>
              <button 
                className="hero-split__btn hero-split__btn--ghost"
                onClick={() => navigate('/menu')}
              >
                Full Menu →
              </button>
            </div>
            <div className="hero-split__trust">
              <div className="trust-item">✦ 30 Min Delivery</div>
              <div className="trust-item">✦ Free over NPR 500</div>
              <div className="trust-item">✦ ★ 4.9 Rating</div>
            </div>
          </div>
          
          <div className="hero-split__right animate-slide-up">
            <div className="art-frame">
              <div className="art-frame__img-wrap art-frame__img-wrap--main">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&q=80" 
                  alt="Organic Pizza Spread" 
                />
              </div>
              <div className="art-frame__img-wrap art-frame__img-wrap--secondary">
                <img 
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80" 
                  alt="Juicy Burger Special" 
                />
              </div>
              <div className="art-frame__badge">
                <span className="art-frame__badge-num">100%</span>
                <span className="art-frame__badge-txt">Organic Ingredients</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE HIGHLIGHTS BAR ── */}
      <section className="benefits-bar">
        <div className="container benefits-bar__grid">
          {BENEFITS.map((benefit, idx) => (
            <div key={idx} className="benefit-card">
              <div className="benefit-card__icon">{benefit.icon}</div>
              <div className="benefit-card__content">
                <h3 className="benefit-card__title">{benefit.title}</h3>
                <h4 className="benefit-card__subtitle">{benefit.subtitle}</h4>
                <p className="benefit-card__desc">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CURATED CHEF'S SPECIALS ── */}
      <section id="curated-showcase" className="curated-showcase">
        <div className="container">
          <div className="section-intro">
            <span className="section-subtitle">Chef's Selection</span>
            <h2 className="section-title">Today's <span>Signatures</span></h2>
            <div className="section-title-line" />
            <p className="section-description">
              Handpicked culinary creations crafted with seasonal ingredients and traditional passion.
            </p>
          </div>

          {loading ? (
            <div className="menu-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-img" />
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-line--title" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredDishes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍳</div>
              <h3>Kitchen is Preparing the Menu</h3>
              <p>Our chefs are refreshing our creations. Check back in a few minutes!</p>
            </div>
          ) : (
            <div className="curated-grid">
              {featuredDishes.map(menu => (
                <MenuCard 
                  key={menu.id} 
                  menu={menu} 
                  onClick={() => setSelectedMenu(menu)} 
                />
              ))}
            </div>
          )}

          <div className="curated-cta">
            <Link to="/menu" className="curated-cta__btn">
              View Entire Menu ({menus.length} items) →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ARTISAN STORY / HERITAGE ── */}
      <section className="heritage-block">
        <div className="container heritage-block__grid">
          <div className="heritage-block__images">
            <div className="heritage-image heritage-image--primary">
              <img 
                src="https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80" 
                alt="Chef preparing lasagna" 
              />
            </div>
            <div className="heritage-image heritage-image--accent">
              <img 
                src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=500&q=80" 
                alt="Fresh farm produce" 
              />
            </div>
            <div className="heritage-experience">
              <span className="exp-number">Est.</span>
              <span className="exp-label">2019</span>
            </div>
          </div>
          
          <div className="heritage-block__content">
            <span className="section-subtitle">Our Heritage</span>
            <h2 className="section-title">Generations of Taste, <span>Refined</span></h2>
            <div className="section-title-line align-left" />
            <p>
              KAHA started as a modest dream in a small Kathmandu kitchen — to bridge traditional family 
              recipes with busy modern lives. Today, we stand as Kathmandu's premium hub for organic, 
              local, and sustainable dining.
            </p>
            <p>
              Every recipe is treated with historical reverence, sourced ethically from local growers, 
              and prepared with a philosophy of absolute zero-waste kitchen practices.
            </p>
            
            <div className="heritage-pills">
              <span className="heritage-pill">🌾 Organic Certified</span>
              <span className="heritage-pill">👨‍🍳 Thakali Legacies</span>
              <span className="heritage-pill">♻️ Zero Plastic Waste</span>
              <span className="heritage-pill">🤝 Local Grower Union</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS (TESTIMONIALS) ── */}
      <section className="reviews-section">
        <div className="container">
          <div className="section-intro">
            <span className="section-subtitle">Patron Stories</span>
            <h2 className="section-title">Loved by the <span>Valley</span></h2>
            <div className="section-title-line" />
          </div>

          <div className="reviews-grid">
            {REVIEWS.map((review, idx) => (
              <div key={idx} className="review-card">
                <div className="review-card__header">
                  <div className="review-card__stars">
                    {'★'.repeat(review.rating)}
                  </div>
                  <span className="review-card__quote">“</span>
                </div>
                <p className="review-card__text">{review.text}</p>
                <div className="review-card__author">
                  <div className="review-card__avatar">{review.avatar}</div>
                  <div className="review-card__meta">
                    <span className="review-card__name">{review.name}</span>
                    <span className="review-card__role">{review.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMAIL NEWSLETTER BANNER ── */}
      <section className="newsletter-banner">
        <div className="container">
          <div className="newsletter-banner__card">
            <span className="card-badge">✨ KAHA Club</span>
            <h2>Join the Inner Circle</h2>
            <p>
              Subscribe to get recipe secrets from our chefs, weekly menu updates, 
              and <strong>50 free KAHA Coins</strong> instantly.
            </p>
            {subbed ? (
              <div className="sub-success-message">
                🎉 Welcome to the club! Check your inbox for your 50 KAHA Coins code.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <input 
                  type="email" 
                  className="newsletter-form__input" 
                  placeholder="Enter your email address" 
                  value={emailSub}
                  onChange={e => setEmailSub(e.target.value)}
                  required 
                />
                <button type="submit" className="newsletter-form__btn">
                  Claim Coins
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── PREMIUM MULTI-COLUMN FOOTER ── */}
      <footer className="homepage-footer">
        <div className="container homepage-footer__grid">
          <div className="footer-col footer-col--brand">
            <h3 className="footer-logo">KAHA <span>Eats</span></h3>
            <p className="footer-brand-desc">
              Kathmandu's premier artisan eatery. We serve premium organic cuisine crafted 
              by generations of culinary experts.
            </p>
            <div className="footer-hours">
              <h4>Kitchen Hours</h4>
              <p>Monday – Sunday: 9:00 AM – 10:00 PM</p>
            </div>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/menu">Order Menu</Link></li>
              <li><Link to="/cart">My Cart</Link></li>
              <li><Link to="/orders">Order History</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-title">Our Philosophy</h4>
            <ul className="footer-links">
              <li><a href="#heritage">Zero Waste Initiative</a></li>
              <li><a href="#farmers">Local Sourcing Union</a></li>
              <li><a href="#rewards">KAHA Coin Rules</a></li>
              <li><a href="#careers">Join Our Kitchen</a></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h4 className="footer-title">Contact Us</h4>
            <p className="footer-contact">
              📍 Jhamsikhel, Lalitpur, Nepal<br />
              📞 +977-1-5540300<br />
              ✉️ hello@kahaeats.com
            </p>
            <div className="footer-badges">
              <span className="footer-badge">eSewa</span>
              <span className="footer-badge">Khalti</span>
              <span className="footer-badge">Cash</span>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="container footer-bottom__inner">
            <p>© {new Date().getFullYear()} KAHA Verse. All rights reserved.</p>
            <p>Built with Passion in Kathmandu, Nepal</p>
          </div>
        </div>
      </footer>

      {selectedMenu && (
        <MenuDetailModal menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
      )}
    </div>
  );
};

export default HomePage;
