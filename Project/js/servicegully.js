/* ServiceGully - simple frontend interactions (HTML, CSS and JavaScript) */
document.addEventListener('DOMContentLoaded', () => {

  // Demo authentication: separate Customer and Service Provider roles.
  // This is frontend-only and stores demo accounts in this browser's LocalStorage.
  function setupAuth() {
    const nav = document.querySelector('header nav');
    if (nav) {
      const extraLinks = [
        ['How It Works', 'index.html#why-servicegully'],
        ['Contact', 'index.html#contact-us']
      ];
      extraLinks.forEach(([label, href]) => {
        if (!Array.from(nav.querySelectorAll('a')).some(a => a.textContent.trim() === label)) {
          const a = document.createElement('a');
          a.href = href;
          a.className = 'nav-link sg-extra-nav';
          a.textContent = label;
          nav.appendChild(a);
        }
      });
    }

    const controls = document.querySelector('header .nav-wrapper > div:last-child');
    if (controls && !document.getElementById('sg-auth-open')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'sg-auth-open';
      button.className = 'btn btn-primary btn-sm';
      button.textContent = 'Sign In / Sign Up';
      controls.appendChild(button);
    }

    if (!document.getElementById('sg-auth-modal')) {
      const overlay = document.createElement('div');
      overlay.id = 'sg-auth-modal';
      overlay.className = 'sg-auth-overlay';
      overlay.hidden = true;
      overlay.innerHTML = `
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
          <p class="sg-auth-demo-note">Frontend demo only. Account details are stored locally in this browser; no real authentication server is connected.</p>
        </section>`;
      document.body.appendChild(overlay);

      let mode = 'signin';
      const form = overlay.querySelector('#sg-auth-form');
      const title = overlay.querySelector('#sg-auth-title');
      const submit = overlay.querySelector('.sg-auth-submit');
      const message = overlay.querySelector('.sg-auth-message');
      const signupFields = overlay.querySelectorAll('.sg-signup-only');
      const setMode = next => {
        mode = next;
        overlay.querySelectorAll('[data-auth-tab]').forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === mode));
        signupFields.forEach(field => { field.hidden = mode !== 'signup'; field.querySelector('input').required = mode === 'signup'; });
        title.textContent = mode === 'signin' ? 'Welcome Back!' : 'Create Your Account';
        submit.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
        message.textContent = '';
      };
      overlay.querySelectorAll('[data-auth-tab]').forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.authTab)));
      const close = () => { overlay.hidden = true; };
      overlay.querySelector('.sg-auth-close').addEventListener('click', close);
      overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
      document.getElementById('sg-auth-open')?.addEventListener('click', () => { overlay.hidden = false; setMode('signin'); });
      form.addEventListener('submit', e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        const accounts = JSON.parse(localStorage.getItem('servicegullyAccounts') || '[]');
        const existing = accounts.find(account => account.email.toLowerCase() === data.email.toLowerCase() && account.role === data.role);
        if (mode === 'signup') {
          if (data.password !== data.confirmPassword) { message.textContent = 'Passwords do not match.'; return; }
          if (existing) { message.textContent = 'An account with this email and role already exists. Please sign in.'; return; }
          accounts.push({ name: data.name, email: data.email, password: data.password, role: data.role, createdAt: new Date().toISOString() });
          localStorage.setItem('servicegullyAccounts', JSON.stringify(accounts));
          localStorage.setItem('servicegullyCurrentUser', JSON.stringify({ name: data.name, email: data.email, role: data.role }));
          message.textContent = `Account created successfully as ${data.role}!`;
        } else {
          if (!existing || existing.password !== data.password) { message.textContent = 'Account not found or password is incorrect for this role.'; return; }
          localStorage.setItem('servicegullyCurrentUser', JSON.stringify({ name: existing.name, email: existing.email, role: existing.role }));
          message.textContent = `Signed in successfully as ${existing.role}!`;
        }
        const authButton = document.getElementById('sg-auth-open');
        if (authButton) authButton.textContent = 'My Account';
      });
    }

    const currentUser = JSON.parse(localStorage.getItem('servicegullyCurrentUser') || 'null');
    const authButton = document.getElementById('sg-auth-open');
    if (currentUser && authButton) authButton.textContent = 'My Account';
  }
  setupAuth();
  const params = new URLSearchParams(window.location.search);

  // Browse page: live search + category/search values received from homepage.
  const searchInput = document.querySelector('.search-field-pill input[placeholder*="Filter by name"]');
  const cards = Array.from(document.querySelectorAll('.pro-card'));
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
        const matchesCategory = !category || text.includes(category) ||
          (category === 'ac repair' && text.includes('air conditioning')) ||
          (category === 'ro water purifier' && (text.includes('ro') || text.includes('purifier')));
        const show = matchesTerm && matchesCategory;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
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

  // Booking modal: opens when a user clicks any existing Book Now button.
  function showBookingModal(serviceName = 'Home Service') {
    if (document.getElementById('sg-booking-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'sg-booking-modal';
    overlay.innerHTML = `
      <div class="sg-modal-backdrop">
        <section class="sg-modal" role="dialog" aria-modal="true" aria-labelledby="sg-modal-title">
          <button type="button" class="sg-modal-close" aria-label="Close">×</button>
          <h2 id="sg-modal-title">Book a Service</h2>
          <p class="sg-modal-subtitle">Request a ${serviceName} professional. This is a frontend demo.</p>
          <form id="sg-booking-form">
            <label>Full name<input name="name" type="text" required minlength="2" placeholder="Enter your name"></label>
            <label>Mobile number<input name="phone" type="tel" required pattern="[0-9]{10}" maxlength="10" placeholder="10-digit mobile number"></label>
            <label>Service address<textarea name="address" required minlength="5" rows="3" placeholder="Enter your address"></textarea></label>
            <label>Preferred date<input name="date" type="date" required></label>
            <button class="sg-submit" type="submit">Submit Booking Request</button>
          </form>
          <p class="sg-demo-note">Demo only: booking details are saved in this browser, not sent to a real service provider.</p>
        </section>
      </div>`;
    document.body.appendChild(overlay);
    const dateInput = overlay.querySelector('input[name="date"]');
    dateInput.min = new Date().toISOString().split('T')[0];
    const close = () => overlay.remove();
    overlay.querySelector('.sg-modal-close').addEventListener('click', close);
    overlay.querySelector('.sg-modal-backdrop').addEventListener('click', e => { if (e.target === e.currentTarget) close(); });
    overlay.querySelector('#sg-booking-form').addEventListener('submit', e => {
      e.preventDefault();
      const booking = Object.fromEntries(new FormData(e.currentTarget).entries());
      booking.service = serviceName;
      booking.createdAt = new Date().toISOString();
      const saved = JSON.parse(localStorage.getItem('servicegullyBookings') || '[]');
      saved.push(booking);
      localStorage.setItem('servicegullyBookings', JSON.stringify(saved));
      overlay.querySelector('.sg-modal').innerHTML = `
        <button type="button" class="sg-modal-close" aria-label="Close">×</button>
        <div class="sg-success-icon">✓</div><h2>Request Submitted!</h2>
        <p class="sg-modal-subtitle">Thank you, ${booking.name}. Your demo booking request for ${serviceName} has been saved successfully.</p>
        <button type="button" class="sg-submit sg-done">Done</button>`;
      overlay.querySelector('.sg-modal-close').addEventListener('click', close);
      overlay.querySelector('.sg-done').addEventListener('click', close);
    });
  }

  document.querySelectorAll('a.btn-primary').forEach(link => {
    if (link.textContent.toLowerCase().includes('book now')) {
      link.addEventListener('click', event => {
        event.preventDefault();
        const card = link.closest('.pro-card');
        const name = card?.querySelector('.font-extrabold')?.textContent?.trim() || 'Home Service';
        const trade = card?.querySelector('p.text-xs.text-slate-500.font-semibold')?.textContent?.trim();
        showBookingModal(trade || name);
      });
    }
  });

  // Small feedback for the SOS demo link; no real emergency dispatch is connected.
  document.querySelectorAll('a[href*="emergency=true"]').forEach(link => {
    link.addEventListener('click', () => {
      sessionStorage.setItem('servicegullyEmergencyDemo', 'true');
    });
  });
});
