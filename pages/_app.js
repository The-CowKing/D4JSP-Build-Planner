import React from 'react';

function MyApp({ Component, pageProps }) {
  return (
    <div style={{ margin: 0, padding: 0, fontFamily: "'Barlow Condensed', sans-serif" }}>
      <style global jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          background: #080608;
          color: #fff;
          font-family: 'Barlow Condensed', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Cinzel', 'Georgia', serif;
          font-weight: 400;
        }
        
        input, textarea, select {
          font-family: 'Barlow Condensed', sans-serif;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0e0c10;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(212, 175, 55, 0.3);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.5);
        }
      `}</style>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
