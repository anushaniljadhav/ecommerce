import React, { useState } from 'react';
import '../styles/Feedback.css';

const Feedback = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // If backend endpoint exists, we'd POST here. For now show mock success.
    console.log('Feedback submitted', form);
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <main className="page-container feedback-page">
      <h2>Feedback</h2>
      {!submitted ? (
        <form className="feedback-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Message
            <textarea name="message" value={form.message} onChange={handleChange} required />
          </label>

          <button type="submit" className="btn-primary">Send feedback</button>
        </form>
      ) : (
        <div className="feedback-thanks">
          <p>Thanks for your feedback! We appreciate you taking the time to help us improve.</p>
        </div>
      )}
    </main>
  );
};

export default Feedback;
