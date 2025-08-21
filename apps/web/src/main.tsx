import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => <div style={{fontFamily:'sans-serif'}}>Adminer Web (Vite + React)</div>;

const el = document.getElementById('root')!;
createRoot(el).render(<App />); 