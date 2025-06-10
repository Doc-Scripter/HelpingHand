<script>
  let showAdminPopup = false;
  let password = '';
  let showPassword = false;

  function openAdminPopup() {
    console.log('Admin button clicked');
    showAdminPopup = true;
  }
  
  function closeAdminPopup() {
    showAdminPopup = false;
    password = '';
    showPassword = false;
  }
  
  function togglePassword() {
    console.log("admin button clicked")
    showPassword = !showPassword;
  }
  
  function processAdmin() {
    // Placeholder for processing admin password
    console.log('Processing admin with password:', password);
    closeAdminPopup();
  }
</script>

<nav class="navbar">
  <div class="navbar-brand">
    <a href="/">HelpingHand</a>
  </div>
  <ul class="navbar-links">
    <li><a href="/">Home</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><button class="admin-btn" type="button" on:click={openAdminPopup}>Admin</button></li>
  </ul>
</nav>

{#if showAdminPopup}
  <div 
    class="admin-popup-overlay" 
    on:click={closeAdminPopup}
    on:keydown={(e) => e.key === 'Escape' && closeAdminPopup()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="admin-popup-title"
    tabindex="-1"
  >
    <div 
      class="admin-popup" 
      role="document"
    >
      <button class="close-btn" on:click={closeAdminPopup} aria-label="Close">&times;</button>
      <div class="admin-popup-header">
        <span class="shield-icon">🛡️</span>
        <span class="admin-title" id="admin-popup-title">Admin Access</span>
      </div>
      <div class="admin-popup-body">
        <label class="password-label">
          Password
          <div class="password-input-wrapper">
            <input 
              type={showPassword ? 'text' : 'password'} 
              bind:value={password} 
              placeholder="Enter admin password" 
              class="password-input" 
            />
            <button 
              type="button" 
              class="eye-btn" 
              on:click={togglePassword} 
              aria-label="Toggle password visibility"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </label>
        <div class="secondary-instruction">Enter admin password</div>
      </div>
      <div class="admin-popup-actions">
        <button class="cancel-btn" on:click={closeAdminPopup}>Cancel</button>
        <button class="process-btn" on:click={processAdmin}>Process</button>
      </div>
    </div>
  </div>
{/if}
