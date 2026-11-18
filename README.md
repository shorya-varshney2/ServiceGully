# ServiceGully — Frontend Project

A frontend-only prototype for discovering local service professionals.

## Technologies
- HTML5
- CSS3
- Tailwind CSS (CDN)
- Vanilla JavaScript

## Pages
- `index.html` — Home page and service search
- `browse.html` — Service directory, category filtering and live search
- `calculator.html` — Service cost estimator
- `partner.html` — Partner information page

## JavaScript functionality
- Search and category filtering on the service directory
- Booking request modal with HTML form validation
- Demo booking requests saved in browser LocalStorage

## Run the project
Open `index.html` in a browser. For a local server, open a terminal in this folder and run:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Scope note
This is a frontend demonstration only. Booking details are stored locally in the browser; no backend, database, authentication, or real service-provider dispatch is connected.
