import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <main className="page-container about-page">
      <section className="about-hero">
        <h2>About ShopEasy</h2>
        <p className="lead">We help busy people find quality products they love — quickly and reliably.</p>
      </section>

      <section className="about-content">
        <h3>Our mission</h3>
        <p>
          At ShopEasy we curate everyday essentials and thoughtful gifts from trusted sellers.
          We prioritize great value, clear product information, and fast delivery so you can
          focus on the things that matter.
        </p>

        <h3>What we offer</h3>
        <ul>
          <li>Curated product selection across categories</li>
          <li>Secure checkout and fast shipping options</li>
          <li>Easy returns and friendly customer support</li>
        </ul>

        <h3>Get in touch</h3>
        <p>If you have questions, suggestions, or partnership ideas, visit our Contact page.</p>
      </section>
    </main>
  );
};

export default About;
