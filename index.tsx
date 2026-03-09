import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ShopProvider } from './context/ShopContext';
import { UIProvider } from './context/UIContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UIProvider>
      <ShopProvider>
        <App />
      </ShopProvider>
    </UIProvider>
  </React.StrictMode>
);