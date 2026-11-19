# ServiceGully — Frontend Project

A frontend-only prototype for discovering local service professionals and placing demo service requests.

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

## Implemented frontend features
- Customer and Service Provider demo sign-up/sign-in with separate roles
- My Account dashboard with account details
- Customer booking history linked to the signed-in customer's email
- Booking status display and cancel-booking option
- Booking form with name, 10-digit phone, address and preferred date validation
- Booking confirmation with a shortcut to My Bookings
- Search and category filtering on the service directory
- Demo accounts and booking requests saved in browser LocalStorage

## Run the project
Open `index.html` in a browser. For a local server, open a terminal in this folder and run:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Scope and limitations
This is a frontend academic demonstration only. LocalStorage is browser-specific and can be cleared by the user. Demo passwords are not protected by server-side authentication. Booking requests are not sent to real service providers, and provider job assignment, payment, notifications and backend/database integration are not implemented.
