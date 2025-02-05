import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import routes from './routes';

const router = createBrowserRouter(routes);

// Remove the DOMContentLoaded listener since Vite already ensures the DOM is ready
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML');
}

const root = createRoot(rootElement);
root.render(<RouterProvider router={router} />); 