import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../styles/MenuPage.css';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  available: boolean;
  preparationTime?: number;
  spicyLevel?: number;
}

interface Business {
  id: string;
  name: string;
  avatar?: string;
  contact: string;
  category: {
    name: string;
  };
  available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  specialInstructions?: string;
}

const MenuPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const token = localStorage.getItem('authToken');
  const businessId = '7476ee15-1407-41fa-9a49-89e0caaf945d'; // Test business ID

  // Fetch businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.kaha.com.np/main/api/v3/businesses/${businessId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setBusinesses([response.data]);
        setSelectedBusiness(response.data);
        await fetchMenuItems(response.data.id);
      } catch (err: any) {
        setError('Failed to load businesses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBusinesses();
    }
  }, [token]);

  // Fetch menu items for selected business
  const fetchMenuItems = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        // Mock menu items - in real scenario, this would come from an API
        const mockMenuItems: MenuItem[] = [
          {
            id: '1',
            name: 'Chicken Momo',
            description: 'Steamed dumplings with chicken filling',
            price: 150,
            category: 'appetizers',
            available: true,
            preparationTime: 15,
            spicyLevel: 2,
          },
          {
            id: '2',
            name: 'Buff Momos',
            description: 'Traditional buff dumplings',
            price: 180,
            category: 'appetizers',
            available: true,
            preparationTime: 18,
            spicyLevel: 3,
          },
          {
            id: '3',
            name: 'Chicken Biryani',
            description: 'Aromatic rice with spiced chicken',
            price: 350,
            category: 'mains',
            available: true,
            preparationTime: 25,
            spicyLevel: 3,
          },
          {
            id: '4',
            name: 'Vegetable Fried Rice',
            description: 'Mixed vegetables with fried rice',
            price: 220,
            category: 'mains',
            available: true,
            preparationTime: 15,
            spicyLevel: 1,
          },
          {
            id: '5',
            name: 'Chocolate Cake',
            description: 'Rich chocolate layer cake',
            price: 100,
            category: 'desserts',
            available: true,
            preparationTime: 5,
            spicyLevel: 0,
          },
          {
            id: '6',
            name: 'Mango Lassi',
            description: 'Refreshing mango yogurt drink',
            price: 80,
            category: 'beverages',
            available: true,
            preparationTime: 3,
            spicyLevel: 0,
          },
        ];
        setMenuItems(mockMenuItems);
        setFilteredItems(mockMenuItems);
      } catch (err: any) {
        setError('Failed to load menu items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Filter items based on search and category
  useEffect(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, menuItems]);

  const categories = ['all', ...new Set(menuItems.map((item) => item.category))];

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    const existingItem = cartItems.find((ci) => ci.id === item.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        )
      );
    } else {
      setCartItems([...cartItems, { ...item, quantity }]);
    }

    setShowModal(false);
    setQuantity(1);
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!token) {
    return (
      <div className="menu-error">
        <p>Please login first</p>
      </div>
    );
  }

  return (
    <div className="menu-container">
      {/* Header */}
      <header className="menu-header">
        <h1>🍽️ Order Food</h1>

        {selectedBusiness && (
          <div className="business-info">
            <img src={selectedBusiness.avatar} alt={selectedBusiness.name} />
            <div>
              <h2>{selectedBusiness.name}</h2>
              <p>{selectedBusiness.category.name}</p>
            </div>
            <span className={`status ${selectedBusiness.available ? 'open' : 'closed'}`}>
              {selectedBusiness.available ? '🟢 Open' : '🔴 Closed'}
            </span>
          </div>
        )}
      </header>

      <div className="menu-content">
        {/* Sidebar - Search & Filters */}
        <aside className="menu-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="categories">
            <h3>Categories</h3>
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h3>🛒 Cart</h3>
            {cartItems.length === 0 ? (
              <p className="empty-cart">No items yet</p>
            ) : (
              <>
                <div className="cart-items-mini">
                  {cartItems.map((item) => (
                    <div key={item.id} className="mini-cart-item">
                      <div>
                        <strong>{item.name}</strong>
                        <p>₹{item.price} x {item.quantity}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <strong>Total:</strong>
                  <strong>₹{cartTotal}</strong>
                </div>
                <button className="checkout-btn">Proceed to Checkout</button>
              </>
            )}
          </div>
        </aside>

        {/* Main Content - Menu Items */}
        <main className="menu-main">
          {loading && <div className="loading">Loading menu...</div>}

          {error && <div className="error-banner">⚠️ {error}</div>}

          <div className="items-grid">
            {filteredItems.length === 0 ? (
              <div className="no-results">
                <p>😕 No items found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}
                  onClick={() => {
                    setSelectedItem(item);
                    setShowModal(true);
                  }}
                >
                  <div className="item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="placeholder">🍲</div>
                    )}
                    {!item.available && <div className="unavailable-badge">Out of Stock</div>}
                  </div>

                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p className="description">{item.description}</p>

                    <div className="item-meta">
                      {item.preparationTime && (
                        <span className="prep-time">⏱️ {item.preparationTime}min</span>
                      )}
                      {item.spicyLevel && item.spicyLevel > 0 && (
                        <span className="spicy">
                          {'🌶️'.repeat(item.spicyLevel)}
                        </span>
                      )}
                    </div>

                    <div className="item-footer">
                      <span className="price">₹{item.price}</span>
                      <button
                        className="add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setShowModal(true);
                        }}
                        disabled={!item.available}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Modal - Item Details & Add to Cart */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              ✕
            </button>

            <div className="modal-content">
              <div className="modal-image">
                {selectedItem.image ? (
                  <img src={selectedItem.image} alt={selectedItem.name} />
                ) : (
                  <div className="placeholder-large">🍲</div>
                )}
              </div>

              <div className="modal-info">
                <h2>{selectedItem.name}</h2>
                <p className="modal-description">{selectedItem.description}</p>

                <div className="modal-meta">
                  {selectedItem.preparationTime && (
                    <div>⏱️ Prep Time: {selectedItem.preparationTime} min</div>
                  )}
                  {selectedItem.spicyLevel && (
                    <div>🌶️ Spice Level: {'🌶️'.repeat(selectedItem.spicyLevel)}</div>
                  )}
                </div>

                <div className="modal-price">
                  <span>Price per unit:</span>
                  <strong>₹{selectedItem.price}</strong>
                </div>

                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="qty-controls">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      min="1"
                    />
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                </div>

                <button
                  className="add-to-cart-btn"
                  onClick={() => addToCart(selectedItem)}
                  disabled={!selectedItem.available}
                >
                  🛒 Add ₹{selectedItem.price * quantity} to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
