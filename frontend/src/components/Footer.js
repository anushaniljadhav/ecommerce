import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-logo">🛍️ ShopEasy</div>
          <p className="footer-tag">Curated finds for everyday life.</p>
        </div>

        <div className="footer-links">
          <Link to="/about" className="footer-link">About Us</Link>
          <Link to="/feedback" className="footer-link">Feedback</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link>
        </div>

        <div className="footer-right">
          <small className="copyright">© {new Date().getFullYear()} ShopEasy</small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
