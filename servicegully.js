/* ServiceGully frontend demo: authentication, customer bookings and search. */
document.addEventListener('DOMContentLoaded', () => {
  const KEYS = {
    accounts: 'servicegullyAccounts',
    currentUser: 'servicegullyCurrentUser',
    bookings: 'servicegullyBookings'
  };
  const readStore = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getCurrentUser = () => readStore(KEYS.currentUser, null);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  // Add simple navigation links and a role-aware account button.
  const nav = document.querySelector('header nav');
  if (nav) {
    [['How It Works', 'index.html#why-servicegully'], ['Contact', 'index.html#contact-us']].forEach(([label, href]) => {
      if (![...nav.querySelectorAll('a')].some(a => a.textContent.trim() === label)) {
        const link = document.createElement('a');
        link.href = href;
        link.className = 'nav-link sg-extra-nav';
        link.textContent = label;
        nav.appendChild(link);
      }
    });
  }
  const controls = document.querySelector('header .nav-wrapper > div:last-child');
  if (controls && !document.getElementById('sg-auth-open')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'sg-auth-open';
    button.className = 'btn btn-primary btn-sm';
    controls.appendChild(button);
  }

  // Authentication dialog: Customer and Service Provider accounts are separate demo roles.
  const authOverlay = document.createElement('div');
  authOverlay.id = 'sg-auth-modal';
  authOverlay.className = 'sg-auth-overlay';
  authOverlay.hidden = true;
  authOverlay.innerHTML = `
    <section class="sg-auth-card" role="dialog" aria-modal="true" aria-labelledby="sg-auth-title">
      <button type="button" class="sg-auth-close" aria-label="Close">×</button>
      <div class="sg-auth-brand">Service<span>Gully</span></div>
      <h2 id="sg-auth-title">Welcome Back!</h2>
      <p class="sg-auth-subtitle">Sign in or create an account to continue.</p>
      <div class="sg-auth-tabs">
        <button type="button" class="active" data-auth-tab="signin">Sign In</button>
        <button type="button" data-auth-tab="signup">Sign Up</button>
      </div>
      <form id="sg-auth-form">
        <div class="sg-role-title">Continue as</div>
        <div class="sg-role-options">
          <label><input type="radio" name="role" value="Customer" checked><span>👤 Customer</span></label>
          <label><input type="radio" name="role" value="Service Provider"><span>🛠️ Service Provider</span></label>
        </div>
        <label class="sg-auth-field sg-signup-only" hidden>Full Name<input name="name" type="text" minlength="2" placeholder="Enter your full name"></label>
        <label class="sg-auth-field">Email Address<input name="email" type="email" required placeholder="you@example.com"></label>
        <label class="sg-auth-field">Password<input name="password" type="password" required minlength="6" placeholder="Minimum 6 characters"></label>
        <label class="sg-auth-field sg-signup-only" hidden>Confirm Password<input name="confirmPassword" type="password" minlength="6" placeholder="Re-enter password"></label>
        <button type="submit" class="sg-auth-submit">Sign In</button>
        <p class="sg-auth-message" aria-live="polite"></p>
      </form>
      <p class="sg-auth-demo-note">Frontend demo only. Demo accounts are saved in this browser and are not protected by a real server.</p>
    </section>`;
  document.body.appendChild(authOverlay);

  // Account dashboard: customers can see their saved bookings; providers see their role dashboard.
  const accountOverlay = document.createElement('div');
  accountOverlay.id = 'sg-account-modal';
  accountOverlay.className = 'sg-auth-overlay';
  accountOverlay.hidden = true;
  accountOverlay.innerHTML = `
    <section class="sg-account-card" role="dialog" aria-modal="true" aria-labelledby="sg-account-title">
      <button type="button" class="sg-auth-close sg-account-close" aria-label="Close">×</button>
      <div class="sg-auth-brand">Service<span>Gully</span></div>
      <div id="sg-account-content"></div>
    </section>`;
  document.body.appendChild(accountOverlay);

  const authForm = authOverlay.querySelector('#sg-auth-form');
  const authMessage = authOverlay.querySelector('.sg-auth-message');
  const authTitle = authOverlay.querySelector('#sg-auth-title');
  const authSubmit = authOverlay.querySelector('.sg-auth-submit');
  let authMode = 'signin';
  const setAuthMode = mode => {
    authMode = mode;
    authOverlay.querySelectorAll('[data-auth-tab]').forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === mode));
    authOverlay.querySelectorAll('.sg-signup-only').forEach(field => {
      field.hidden = mode !== 'signup';
      field.querySelector('input').required = mode === 'signup';
    });
    authTitle.textContent = mode === 'signin' ? 'Welcome Back!' : 'Create Your Account';
    authSubmit.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
    authMessage.textContent = '';
  };
  const openAuth = (mode = 'signin', message = '') => {
    accountOverlay.hidden = true;
    authOverlay.hidden = false;
    setAuthMode(mode);
    authMessage.textContent = message;
  };
  const closeAuth = () => { authOverlay.hidden = true; };
  authOverlay.querySelectorAll('[data-auth-tab]').forEach(tab => tab.addEventListener('click', () => setAuthMode(tab.dataset.authTab)));
  authOverlay.querySelector('.sg-auth-close').addEventListener('click', closeAuth);
  authOverlay.addEventListener('click', event => { if (event.target === authOverlay) closeAuth(); });

  const accountContent = accountOverlay.querySelector('#sg-account-content');
  const closeAccount = () => { accountOverlay.hidden = true; };
  accountOverlay.querySelector('.sg-account-close').addEventListener('click', closeAccount);
  accountOverlay.addEventListener('click', event => { if (event.target === accountOverlay) closeAccount(); });

  function updateAccountButton() {
    const button = document.getElementById('sg-auth-open');
    if (!button) return;
    const user = getCurrentUser();
    button.textContent = user ? 'My Account' : 'Sign In / Sign Up';
  }

  function renderAccount() {
    const user = getCurrentUser();
    if (!user) { openAuth(); return; }
    const bookings = readStore(KEYS.bookings, []);
    const myBookings = bookings.filter(item => item.customerEmail === user.email);
    const heading = user.role === 'Customer' ? 'Customer Dashboard' : 'Service Provider Dashboard';
    let body = `
      <h2 id="sg-account-title">${heading}</h2>
      <p class="sg-account-welcome">Welcome, <strong>${escapeHTML(user.name)}</strong></p>
      <div class="sg-account-profile">
        <div><span>Name</span><strong>${escapeHTML(user.name)}</strong></div>
        <div><span>Email</span><strong>${escapeHTML(user.email)}</strong></div>
        <div><span>Account type</span><strong>${escapeHTML(user.role)}</strong></div>
      </div>`;
    if (user.role === 'Customer') {
      body += `<div class="sg-bookings-heading"><h3>My Bookings</h3><span>${myBookings.length} total</span></div>`;
      if (!myBookings.length) {
        body += `<div class="sg-empty-bookings"><strong>No bookings yet</strong><p>Your service requests will appear here after you book a professional.</p><a href="browse.html" class="sg-account-browse">Browse Services</a></div>`;
      } else {
        body += `<div class="sg-booking-list">${myBookings.slice().reverse().map(item => `
          <article class="sg-booking-item">
            <div class="sg-booking-top"><strong>${escapeHTML(item.service)}</strong><span class="sg-status ${item.status === 'Cancelled' ? 'is-cancelled' : ''}">${escapeHTML(item.status || 'Pending')}</span></div>
            <p><b>Booking ID:</b> ${escapeHTML(item.id)}</p>
            <p><b>Date:</b> ${escapeHTML(item.date)}</p>
            <p><b>Address:</b> ${escapeHTML(item.address)}</p>
            ${item.status !== 'Cancelled' ? `<button type="button" class="sg-cancel-booking" data-booking-id="${escapeHTML(item.id)}">Cancel booking</button>` : ''}
          </article>`).join('')}</div>`;
      }
    } else {
      body += `<div class="sg-provider-dashboard"><h3>Provider Profile</h3><p>Your Service Provider demo account is active. In this frontend prototype, job assignment and customer-provider messaging are not connected yet.</p><a href="partner.html" class="sg-account-browse">Open Partner Portal</a></div>`;
    }
    body += `<button type="button" class="sg-logout">Sign Out</button>`;
    accountContent.innerHTML = body;
    accountContent.querySelector('.sg-logout').addEventListener('click', () => {
      localStorage.removeItem(KEYS.currentUser);
      accountOverlay.hidden = true;
      updateAccountButton();
    });
    accountContent.querySelectorAll('.sg-cancel-booking').forEach(button => button.addEventListener('click', () => {
      const allBookings = readStore(KEYS.bookings, []);
      const booking = allBookings.find(item => item.id === button.dataset.bookingId && item.customerEmail === user.email);
      if (booking) {
        booking.status = 'Cancelled';
        writeStore(KEYS.bookings, allBookings);
        renderAccount();
      }
    }));
  }

  document.getElementById('sg-auth-open')?.addEventListener('click', () => {
    if (getCurrentUser()) {
      renderAccount();
      accountOverlay.hidden = false;
    } else openAuth();
  });

  authForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(authForm).entries());
    const accounts = readStore(KEYS.accounts, []);
    const email = data.email.trim().toLowerCase();
    const existing = accounts.find(account => account.email.toLowerCase() === email && account.role === data.role);
    if (authMode === 'signup') {
      if (data.password !== data.confirmPassword) { authMessage.textContent = 'Passwords do not match.'; return; }
      if (existing) { authMessage.textContent = 'This email already has an account for the selected role. Please sign in.'; return; }
      const newAccount = { name: data.name.trim(), email, password: data.password, role: data.role, createdAt: new Date().toISOString() };
      accounts.push(newAccount);
      writeStore(KEYS.accounts, accounts);
      writeStore(KEYS.currentUser, { name: newAccount.name, email, role: newAccount.role });
    } else {
      if (!existing || existing.password !== data.password) { authMessage.textContent = 'Account not found or password is incorrect for this role.'; return; }
      writeStore(KEYS.currentUser, { name: existing.name, email: existing.email, role: existing.role });
    }
    closeAuth();
    updateAccountButton();
    renderAccount();
    accountOverlay.hidden = false;
  });
  updateAccountButton();

  // Browse page live search and category filtering.
  const params = new URLSearchParams(window.location.search);
  const searchInput = document.querySelector('.search-field-pill input[placeholder*="Filter by name"]');
  const cards = [...document.querySelectorAll('.pro-card')];
  if (cards.length) {
    const category = (params.get('category') || '').toLowerCase();
    const searchTerm = (params.get('search') || '').trim();
    if (searchInput && searchTerm) searchInput.value = searchTerm;
    const resultMessage = document.createElement('p');
    resultMessage.className = 'text-xs text-slate-500';
    resultMessage.style.margin = '0.25rem 0';
    const grid = cards[0].parentElement;
    grid.parentElement.insertBefore(resultMessage, grid);
    function filterCards() {
      const term = (searchInput ? searchInput.value : searchTerm).toLowerCase().trim();
      let visible = 0;
      cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const matchesTerm = !term || text.includes(term);
        const matchesCategory = !category || text.includes(category) || (category === 'ac repair' && text.includes('air conditioning')) || (category === 'ro water purifier' && (text.includes('ro') || text.includes('purifier')));
        card.style.display = matchesTerm && matchesCategory ? '' : 'none';
        if (matchesTerm && matchesCategory) visible++;
      });
      resultMessage.textContent = `${visible} service professional(s) found`;
      let empty = document.getElementById('no-results-message');
      if (!visible && !empty) {
        empty = document.createElement('p');
        empty.id = 'no-results-message';
        empty.className = 'card p-6 text-center text-slate-600';
        empty.textContent = 'No professionals found. Try another service or keyword.';
        grid.after(empty);
      } else if (visible && empty) empty.remove();
    }
    searchInput?.addEventListener('input', filterCards);
    filterCards();
  }

  // Booking: requires a signed-in Customer and saves a booking against that account.
  function showBookingModal(serviceName = 'Home Service') {
    const user = getCurrentUser();
    if (!user) {
      openAuth('signin', 'Please sign in as a Customer before placing a booking.');
      return;
    }
    if (user.role !== 'Customer') {
      openAuth('signin', 'Bookings can be placed from a Customer account. Select Customer to continue.');
      return;
    }
    document.getElementById('sg-booking-modal')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'sg-booking-modal';
    overlay.innerHTML = `
      <div class="sg-modal-backdrop"><section class="sg-modal" role="dialog" aria-modal="true" aria-labelledby="sg-modal-title">
        <button type="button" class="sg-modal-close" aria-label="Close">×</button>
        <h2 id="sg-modal-title">Book a Service</h2>
        <p class="sg-modal-subtitle">Request a ${escapeHTML(serviceName)} professional.</p>
        <form id="sg-booking-form">
          <label>Full name<input name="name" type="text" required minlength="2" value="${escapeHTML(user.name)}"></label>
          <label>Mobile number<input name="phone" type="tel" required pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number"></label>
          <label>Service address<textarea name="address" required minlength="5" rows="3" placeholder="Enter your address"></textarea></label>
          <label>Preferred date<input name="date" type="date" required></label>
          <button class="sg-submit" type="submit">Submit Booking Request</button>
        </form>
        <p class="sg-demo-note">Frontend demo only: this request is saved in this browser and is not sent to a real provider.</p>
      </section></div>`;
    document.body.appendChild(overlay);
    const dateInput = overlay.querySelector('input[name="date"]');
    dateInput.min = new Date().toISOString().split('T')[0];
    const close = () => overlay.remove();
    overlay.querySelector('.sg-modal-close').addEventListener('click', close);
    overlay.querySelector('.sg-modal-backdrop').addEventListener('click', event => { if (event.target === event.currentTarget) close(); });
    overlay.querySelector('#sg-booking-form').addEventListener('submit', event => {
      event.preventDefault();
      const booking = Object.fromEntries(new FormData(event.currentTarget).entries());
      booking.id = `SG${Date.now().toString().slice(-8)}`;
      booking.service = serviceName;
      booking.customerEmail = user.email;
      booking.customerName = user.name;
      booking.status = 'Pending';
      booking.createdAt = new Date().toISOString();
      const saved = readStore(KEYS.bookings, []);
      saved.push(booking);
      writeStore(KEYS.bookings, saved);
      overlay.querySelector('.sg-modal').innerHTML = `
        <button type="button" class="sg-modal-close" aria-label="Close">×</button>
        <div class="sg-success-icon">✓</div><h2>Request Submitted!</h2>
        <p class="sg-modal-subtitle">Your ${escapeHTML(serviceName)} booking request has been saved. You can track it in My Account → My Bookings.</p>
        <button type="button" class="sg-submit sg-view-bookings">View My Bookings</button>`;
      overlay.querySelector('.sg-modal-close').addEventListener('click', close);
      overlay.querySelector('.sg-view-bookings').addEventListener('click', () => {
        close();
        renderAccount();
        accountOverlay.hidden = false;
      });
    });
  }

  document.querySelectorAll('a.btn-primary').forEach(link => {
    if (link.textContent.toLowerCase().includes('book now')) {
      link.addEventListener('click', event => {
        event.preventDefault();
        const card = link.closest('.pro-card');
        const trade = card?.querySelector('p.text-xs.text-slate-500.font-semibold')?.textContent?.trim();
        const name = card?.querySelector('.font-extrabold')?.textContent?.trim();
        showBookingModal(trade || name || 'Home Service');
      });
    }
  });

  document.querySelectorAll('a[href*="emergency=true"]').forEach(link => link.addEventListener('click', () => sessionStorage.setItem('servicegullyEmergencyDemo', 'true')));
});
