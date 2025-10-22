import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/Api';
import '../styles/Orders.css';

const SuccessBanner = ({ orderId }) => (
  <div className="order-success">
    <div className="tick">✅</div>
    <div>
      <h2>Order placed successfully!</h2>
      <p>Congratulations — your order <strong>#{orderId}</strong> is confirmed. We'll email you the details shortly.</p>
    </div>
  </div>
);

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/orders');
      setOrders(resp.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // If navigated from checkout we may get orderId in location.state or query
  const justPlaced = location.state?.orderPlaced;
  const orderId = location.state?.orderId;

  return (
    <div className="orders-page">
      <div className="container">
        {justPlaced && <SuccessBanner orderId={orderId || '—'} />}
        <h1>Your Orders</h1>
        {loading && <div>Loading orders…</div>}
        {error && <div className="error">{error}</div>}

        {!loading && orders.length === 0 && (
          <p>No orders yet — your orders will appear here after checkout.</p>
        )}

        <div className="orders-list">
          {orders.map(o => (
            <div key={o._id} className="order-card">
              <div className="order-header">
                <div>Order #{o._id}</div>
                <div>{o.status}</div>
              </div>
              <div className="order-body">
                <div>Total: ${o.total}</div>
                <div>Items: {o.items?.length || 0}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
