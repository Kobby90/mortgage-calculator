import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router-dom";
import "./app.css";
import "./components/MortgageCalculator.css";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Mortgage Calculator</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div id="root">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="root">
          <h1>Error</h1>
          <p>Something went wrong</p>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
