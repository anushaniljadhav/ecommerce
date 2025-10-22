import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productService } from '../services/productService';
import '../styles/ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [moreProducts, setMoreProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(0);
  const [allowRepeats, setAllowRepeats] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [stockStatus, setStockStatus] = useState('All');
  const [brand, setBrand] = useState('All');
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Apply filters
  useEffect(() => {
    if (!moreProducts || moreProducts.length === 0) {
      setFilteredProducts([]);
      return;
    }

    let list = [...moreProducts];
    if (filterCategory !== 'All') {
      list = list.filter(p => p.category === filterCategory);
    }
    if (maxPrice > 0) {
      list = list.filter(p => p.price <= maxPrice);
    }
    if (minRating > 0) {
      list = list.filter(p => Math.floor(p.rating || 0) >= minRating);
    }
    if (stockStatus !== 'All') {
      if (stockStatus === 'In Stock') list = list.filter(p => p.stock > 0);
      else list = list.filter(p => p.stock === 0);
    }
    if (brand !== 'All') {
      list = list.filter(p => (p.brand || p.manufacturer || 'Unknown') === brand);
    }

    // If repeats allowed, ensure at least 30 items by repeating the list if needed (but cap at 40)
    if (allowRepeats) {
      const result = [];
      const desired = Math.min(40, Math.max(30, list.length || moreProducts.length));
      const source = list.length ? list : moreProducts;
      let i = 0;
      while (result.length < desired && source.length > 0) {
        result.push(source[i % source.length]);
        i++;
      }
      setFilteredProducts(result.slice(0, desired));
    } else {
      // unique items only, no repeats — cap at 40
      const unique = list.length ? list : moreProducts;
      setFilteredProducts(unique.slice(0, 40));
    }
  }, [moreProducts, filterCategory, maxPrice, allowRepeats]);

  const fetchProduct = async () => {
    try {
      // fetch single product
      const data = await productService.getProduct(id);
      setProduct(data);

      // fetch additional products (up to 40) and exclude the current one
      try {
        const all = await productService.getAllProducts();
        const others = (all || []).filter(p => p._id !== data._id);
        // Prefer same category first, then fill with others
        const sameCategory = others.filter(p => p.category === data.category);
        const notSame = others.filter(p => p.category !== data.category);
        const combined = [...sameCategory, ...notSame].slice(0, 40);
        setMoreProducts(combined);
      } catch (err) {
        console.warn('Failed to fetch additional products', err);
        setMoreProducts([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const result = await addToCart(product._id, quantity);
    if (result.success) {
      setMessage({ type: 'success', text: 'Product added to cart!' });
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage({ type: 'error', text: result.error });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) {
    return <div className="loading">Loading product...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  return (
    <div className="product-detail-page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        
        <div className="product-detail">
          <div className="product-image">
            <img src={product.image || '/images/placeholder.jpg'} alt={product.name} />
          </div>
          
          <div className="product-info">
            {message && (
              <div className={`inline-message ${message.type === 'error' ? 'error' : 'success'}`} style={{marginBottom:8}}>
                {message.text} {message.type === 'success' && <Link to="/cart" style={{marginLeft:8}}>View Cart</Link>}
              </div>
            )}
            <h1>{product.name}</h1>
            <p className="product-category">{product.category}</p>
            <p className="product-description">{product.description}</p>
            
            <div className="product-price">${product.price}</div>
            
            <div className="stock-info">
              {product.stock > 0 ? (
                <span className="in-stock">In Stock ({product.stock} available)</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>
            
            {product.stock > 0 && (
              <div className="purchase-section">
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <select 
                    value={quantity} 
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                  >
                    {[...Array(Math.min(product.stock, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary btn-large"
                >
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </button>
              </div>
            )}
              {moreProducts.length > 0 && (
                <div className="more-section">
                  <button className="filter-toggle" onClick={() => setFilterOpen(!filterOpen)}>☰ Filters</button>
                  <h2>You may also like <span className="results-badge">{filteredProducts.length || moreProducts.length}</span></h2>

                  <div className={`filter-drawer ${filterOpen ? 'open' : ''}`}>
                    <div className="filter-header">
                      <strong>Filters</strong>
                      <button onClick={() => setFilterOpen(false)} className="close-filter">✕</button>
                    </div>
                    <div className="filter-body">
                      <label>Category</label>
                      <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option>All</option>
                        {[...new Set(moreProducts.map(p => p.category))].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      <label>Max Price (${maxPrice})</label>
                      <input type="range" min="0" max={Math.max(...moreProducts.map(p => p.price), 100)} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} />
                    <label>Minimum Rating</label>
                    <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                      <option value={0}>Any</option>
                      <option value={1}>1+</option>
                      <option value={2}>2+</option>
                      <option value={3}>3+</option>
                      <option value={4}>4+</option>
                      <option value={5}>5</option>
                    </select>

                    <label>Stock Status</label>
                    <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                      <option>All</option>
                      <option>In Stock</option>
                      <option>Out of Stock</option>
                    </select>

                    <label>Brand</label>
                    <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                      <option>All</option>
                      {[...new Set(moreProducts.map(p => (p.brand || p.manufacturer || 'Unknown')))].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                        <label style={{fontSize:12}}>Allow repeats</label>
                        <input type="checkbox" checked={allowRepeats} onChange={(e) => setAllowRepeats(e.target.checked)} />
                      </div>

                      <button className="btn btn-primary" onClick={() => { setFilterOpen(false); }}>Apply</button>
                      <button className="btn btn-outline" style={{marginLeft:8}} onClick={() => { setFilterCategory('All'); setMaxPrice(0); setAllowRepeats(true); setFilterOpen(false); }}>Clear</button>
                    </div>
                  </div>

                  <div className="more-grid">
                    {(filteredProducts.length ? filteredProducts : moreProducts).map(p => (
                      <div key={p._id} className="more-card">
                        <Link to={`/product/${p._id}`} className="more-image">
                          <img src={p.image || '/images/placeholder.jpg'} alt={p.name} />
                        </Link>
                        <div className="more-info">
                          <Link to={`/product/${p._id}`} className="more-name">{p.name}</Link>
                          <div className="more-price">${p.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;