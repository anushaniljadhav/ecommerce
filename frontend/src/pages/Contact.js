import React, { useState } from 'react';
import '../styles/Contact.css';

const Contact = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('support@shopeasy.example');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('copy failed', err);
    }
  };

  return (
    <main className="page-container contact-page">
      <h2>Contact Us</h2>
      <p>
        Email: <strong>support@shopeasy.example</strong>
        <button className="copy-btn" onClick={copyEmail}>{copied ? 'Copied' : 'Copy'}</button>
      </p>

      <p>Phone: <strong>+1 (555) 123-4567</strong></p>

      <p>Address: 123 Market Ln, Commerce City</p>
    </main>
  );
};

export default Contact;
