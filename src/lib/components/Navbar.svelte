<script>
  import { goto } from '$app/navigation';
  
  let showAdminPopup = false;
  let password = '';
  let showPassword = false;
  let loading = false;
  let error = '';

  function openAdminPopup() {
    console.log('Admin button clicked');
    showAdminPopup = true;
    error = '';
  }
  
  function closeAdminPopup() {
    showAdminPopup = false;
    password = '';
    showPassword = false;
    loading = false;
    error = '';
  }
  
  function togglePassword() {
    console.log("admin button clicked")
    showPassword = !showPassword;
  }
  
  async function processAdmin() {
    if (!password) {
      error = 'Please enter password';
      return;
    }
    
    loading = true;
    error = '';
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: 'admin', 
          password: password 
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        closeAdminPopup();
        goto('/admin');
      } else {
        error = result.error || 'Invalid password';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
      console.error('Admin login error:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      processAdmin();
    }
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
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div 
      class="admin-popup" 
      role="document"
      on:click|stopPropagation
    >
      <button class="close-btn" on:click={closeAdminPopup} aria-label="Close">&times;</button>
      <div class="admin-popup-header">
        <span class="shield-icon">🛡️</span>
        <span class="admin-title" id="admin-popup-title">Admin Access</span>
      </div>
      <div class="admin-popup-body">
        {#if error}
          <div class="error-message">
            {error}
          </div>
        {/if}
        
        <label class="password-label">
          Password
          <div class="password-input-wrapper">
            <input 
              type={showPassword ? 'text' : 'password'} 
              bind:value={password} 
              placeholder="Enter admin password" 
              class="password-input"
              on:keypress={handleKeyPress}
              disabled={loading}
            />
            <button 
              type="button" 
              class="eye-btn" 
              on:click={togglePassword} 
              aria-label="Toggle password visibility"
              disabled={loading}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </label>
        <div class="secondary-instruction">Enter admin password (demo: admin123)</div>
      </div>
      <div class="admin-popup-actions">
        <button class="cancel-btn" on:click={closeAdminPopup} disabled={loading}>Cancel</button>
        <button class="process-btn" on:click={processAdmin} disabled={loading}>
          {loading ? 'Logging in...' : 'Proceed'}
        </button>
      </div>
    </div>
  </div>
{/if}