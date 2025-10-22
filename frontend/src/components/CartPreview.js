import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/CartPreview.css';

const CartPreview = () => {
  const { cartItems, getCartTotal, previewOpen, setPreviewOpen } = useCart();
  const navigate = useNavigate();

  if (!previewOpen) return null;

  return (
    <div className="cart-preview">
      <div className="cart-preview-inner">
        <div className="cart-preview-header">
          <h4>Your Cart</h4>
          <button onClick={() => setPreviewOpen(false)}>✕</button>
        </div>

        <div className="cart-preview-items">
          {cartItems.slice(0,4).map(item => (
            <div key={item._id} className="cp-item">
              <img src={item.image || '/images/placeholder.jpg'} alt={item.name} />
              <div className="cp-info">
                <div className="cp-name">{item.name}</div>
                <div className="cp-qty">Qty: {item.cart_quantity}</div>
              </div>
              <div className="cp-price">${(item.price * item.cart_quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="cart-preview-footer">
          <div className="cp-total">Total: ${getCartTotal().toFixed(2)}</div>
          <div className="cp-actions">
            <Link to="/cart" className="btn btn-outline" onClick={() => setPreviewOpen(false)}>View Cart</Link>
            <button className="btn btn-primary" onClick={() => { setPreviewOpen(false); navigate('/checkout'); }}>Checkout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPreview;
