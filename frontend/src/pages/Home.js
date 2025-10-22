import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  // Unsplash image (free to use) as live-photo background; replace with local asset if desired
  const bgUrl = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=2000&q=80';

  const quotes = [
    { text: "Quality products. Thoughtful design. Fast delivery.", author: '— The Everyday Shop' },
    { text: "Finding gems has never been easier. Love the curated selection!", author: '— Jamie R.' },
    { text: "Excellent customer service and the packaging felt premium.", author: '— Priya S.' },
    { text: "Great prices and speedy shipping. I keep coming back.", author: '— Alex M.' },
    { text: "A delightful shopping experience from start to finish.", author: '— Taylor W.' },
  ];

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % quotes.length);
    }, 4000);
    return () => clearInterval(t);
  }, [quotes.length, paused]);

  return (
    <div className="home-hero" style={{ backgroundImage: `url(${bgUrl})` }}>
      <div className="overlay">
        <div className="hero-content container">
          <h1 className="hero-title">Discover something you love</h1>
          <p className="hero-sub">Curated products, fast shipping, and deals you'll want to keep.</p>

          <div
            className="quotes-carousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-live="polite"
          >
            {quotes.map((q, i) => (
              <div key={i} className={`quote ${i === index ? 'active' : ''}`}>
                <p className="quote-text">"{q.text}"</p>
                <p className="quote-author">{q.author}</p>
              </div>
            ))}

            <div className="quote-dots" aria-hidden>
              {quotes.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === index ? 'dot-active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Show quote ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
