import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import '../styles/Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
      // derive categories
      const cats = Array.from(new Set((data || []).map(p => p.category).filter(Boolean)));
      setCategories(['All', ...cats]);
    } catch (err) {
      // try to show a useful message coming from the API if available
      const message = err?.message || err?.error || JSON.stringify(err);
      setError('Failed to load products: ' + message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (e) => {
    const selected = e.target.value;
    setCategory(selected);
    setLoading(true);
    try {
      if (!selected || selected === 'All') {
        await fetchProducts();
      } else {
        const data = await productService.getProductsByCategory(selected);
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Category filter error', err);
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!searchQuery) {
      // empty - load all
      setLoading(true);
      await fetchProducts();
      return;
    }

    try {
      setLoading(true);
      // try server-side search first
      const data = await productService.searchProducts(searchQuery);
      // if API returns data, use it; otherwise filter client-side
      if (data && data.length >= 0) {
        // prioritize exact matches (case-insensitive), then startsWith, then includes
        const q = searchQuery.trim().toLowerCase();
        const sorted = [...data].sort((a, b) => {
          const an = (a.name || '').toLowerCase();
          const bn = (b.name || '').toLowerCase();
          const aExact = an === q ? 0 : an.startsWith(q) ? 1 : an.includes(q) ? 2 : 3;
          const bExact = bn === q ? 0 : bn.startsWith(q) ? 1 : bn.includes(q) ? 2 : 3;
          if (aExact !== bExact) return aExact - bExact;
          return an.localeCompare(bn);
        });
        setProducts(sorted);
      } else {
        const q = searchQuery.trim().toLowerCase();
        setProducts(prev => {
          const filtered = prev.filter(p => (p.name || '').toLowerCase().includes(q));
          const sorted = [...filtered].sort((a, b) => {
            const an = (a.name || '').toLowerCase();
            const bn = (b.name || '').toLowerCase();
            const aExact = an === q ? 0 : an.startsWith(q) ? 1 : an.includes(q) ? 2 : 3;
            const bExact = bn === q ? 0 : bn.startsWith(q) ? 1 : bn.includes(q) ? 2 : 3;
            if (aExact !== bExact) return aExact - bExact;
            return an.localeCompare(bn);
          });
          return sorted;
        });
      }
    } catch (err) {
      console.warn('Search failed, falling back to client filter', err);
      const q = searchQuery.trim().toLowerCase();
      setProducts(prev => {
        const filtered = prev.filter(p => (p.name || '').toLowerCase().includes(q));
        const sorted = [...filtered].sort((a, b) => {
          const an = (a.name || '').toLowerCase();
          const bn = (b.name || '').toLowerCase();
          const aExact = an === q ? 0 : an.startsWith(q) ? 1 : an.includes(q) ? 2 : 3;
          const bExact = bn === q ? 0 : bn.startsWith(q) ? 1 : bn.includes(q) ? 2 : 3;
          if (aExact !== bExact) return aExact - bExact;
          return an.localeCompare(bn);
        });
        return sorted;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    // send file to server for image search
    (async () => {
      try {
        setLoading(true);
        const form = new FormData();
        form.append('image', file);
        const resp = await fetch('http://localhost:5000/api/search-by-image', {
          method: 'POST',
          body: form
        });
        if (!resp.ok) {
          const er = await resp.json().catch(() => null);
          throw new Error(er?.error || 'Image search failed');
        }
        const results = await resp.json();
        if (Array.isArray(results)) {
          setProducts(results.map(r => ({
            ...r,
            _id: r._id || r.id
          })));
        }
      } catch (err) {
        console.error('Image search error', err);
        setMessage({ type: 'error', text: err.message || 'Image search failed' });
        setTimeout(() => setMessage(null), 4000);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleAddToCart = async (productId) => {
    const result = await addToCart(productId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Product added to cart!' });
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage({ type: 'error', text: result.error });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="error" style={{padding:20}}>
        <div style={{marginBottom:8}}>{error}</div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" onClick={() => { setLoading(true); setError(''); fetchProducts(); }}>Retry</button>
          <button className="btn" onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="container">
        <h1>Our Products</h1>
        {message && (
          <div className={`inline-message ${message.type === 'error' ? 'error' : 'success'}`} style={{marginBottom:12}}>
            {message.text} {message.type === 'success' && <Link to="/cart" style={{marginLeft:8}}>View Cart</Link>}
          </div>
        )}

        <div className="products-toolbar" style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
          <select value={category} onChange={handleCategoryChange} style={{padding:8,borderRadius:6,border:'1px solid #ddd'}}>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <form onSubmit={handleSearch} style={{display:'flex',gap:8,flex:1}}>
            <input placeholder="Search products by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{flex:1,padding:8,borderRadius:6,border:'1px solid #ddd'}} />
            <button className="btn btn-outline" onClick={handleSearch}>Search</button>
          </form>

          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button className="btn btn-outline" onClick={handleImageClick}>Upload Image</button>
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleImageSelect} />
            {imagePreview && <img src={imagePreview} alt="preview" style={{width:72,height:48,objectFit:'cover',borderRadius:6}} />}
          </div>
        </div>

        <div className="products-grid">
          {products.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                {product.stock < 10 && product.stock > 0 && (
                  <span className="stock-badge">Low Stock</span>
                )}
                {product.stock === 0 && (
                  <span className="stock-badge out-of-stock">Out of Stock</span>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>
                <div className="product-rating">
                  {'⭐'.repeat(Math.floor(product.rating || 4))}
                  <span>({product.reviews || 0})</span>
                </div>
                <div className="product-price">${product.price}</div>
                <div className="product-actions">
                  <Link to={`/product/${product._id}`} className="btn btn-outline">
                    View Details
                  </Link>
                  <button 
                    onClick={() => handleAddToCart(product._id)}
                    className="btn btn-primary"
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;