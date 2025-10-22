import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/Api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../styles/Checkout.css';

// Small presentational components
const Field = ({ label, name, value, onChange, required = false }) => (
  <div className="form-group">
    <label htmlFor={name}>{label}{required && ' *'}</label>
    <input id={name} name={name} value={value} onChange={onChange} required={required} />
  </div>
);

const OrderItem = ({ item }) => (
  <div className="order-item">
    <div className="item-left">
      <img src={item.image} alt={item.name} style={{width:72,height:72,objectFit:'cover',borderRadius:6}} />
      <div style={{marginLeft:12}}>
        <div className="item-name">{item.name}</div>
        <div className="item-qty">Qty: {item.cart_quantity}</div>
      </div>
    </div>
    <div className="item-right">${(item.price * item.cart_quantity).toFixed(2)}</div>
  </div>
);

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const [payment, setPayment] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = useMemo(() => getCartTotal(), [cartItems]);
  const shippingCost = useMemo(() => (subtotal > 100 ? 0 : 9.99), [subtotal]);
  const total = useMemo(() => subtotal + shippingCost, [subtotal, shippingCost]);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!cartItems || cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShipping(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPayment(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!shipping.fullName || !shipping.address || !shipping.city || !shipping.postalCode || !shipping.country) {
      setError('Please complete the shipping information');
      return false;
    }
    if (paymentMethod === 'card') {
      if (!payment.cardNumber || !payment.expiry || !payment.cvv) {
        setError('Please complete the payment information (mock)');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const payload = {
        shipping_address: shipping,
        payment_method: paymentMethod === 'card' ? { type: 'card', last4: payment.cardNumber.slice(-4) } : { type: 'cod' }
      };

      const resp = await api.post('/orders', payload);
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Checkout error', err);
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        {error && <div className="error" style={{marginBottom:12}}>{error}</div>}

        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <h3>Shipping</h3>
            <Field label="Full name" name="fullName" value={shipping.fullName} onChange={handleShippingChange} required />
            <Field label="Address" name="address" value={shipping.address} onChange={handleShippingChange} required />
            <div className="form-row">
              <Field label="City" name="city" value={shipping.city} onChange={handleShippingChange} required />
              <Field label="Postal Code" name="postalCode" value={shipping.postalCode} onChange={handleShippingChange} required />
            </div>
            <Field label="Country" name="country" value={shipping.country} onChange={handleShippingChange} required />

            <h3 style={{marginTop:18}}>Payment</h3>
            <div className="form-group">
              <label>Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{padding:8,borderRadius:6}}>
                <option value="card">Card (mock)</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>

            {paymentMethod === 'card' && (
              <>
                <Field label="Card Number" name="cardNumber" value={payment.cardNumber} onChange={handlePaymentChange} required />
                <div className="form-row">
                  <Field label="Expiry" name="expiry" value={payment.expiry} onChange={handlePaymentChange} required />
                  <Field label="CVV" name="cvv" value={payment.cvv} onChange={handlePaymentChange} required />
                </div>
              </>
            )}

            {paymentMethod === 'cod' && (
              <div style={{padding:10,background:'#fff9f0',border:'1px solid #f1e0c8',borderRadius:6,marginTop:8}}>
                <strong>Cash on Delivery selected.</strong>
                <div style={{marginTop:6}}>Please have the exact amount ready. Additional verification may be requested on delivery.</div>
              </div>
            )}

            <div style={{marginTop:16}}>
              <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
                {loading ? 'Processing...' : `Place Order — $${total.toFixed(2)}`}
              </button>
            </div>
          </form>

          <aside className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map(item => (
                <OrderItem key={item._id} item={item} />
              ))}
            </div>

            <div className="summary-totals">
              <div className="line"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="line"><span>Shipping</span><span>${shippingCost.toFixed(2)}</span></div>
              <div className="line total"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;