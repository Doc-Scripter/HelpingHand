<script>
  import { goto } from '$app/navigation';
  
  let username = '';
  let password = '';
  let loading = false;
  let error = '';
  
  async function handleLogin() {
    if (!username || !password) {
      error = 'Please enter both username and password';
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
        body: JSON.stringify({ username, password })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Redirect to admin dashboard
        goto('/admin');
      } else {
        error = result.error || 'Login failed';
      }
    } catch (err) {
      error = 'Network error. Please try again.';
      console.error('Login error:', err);
    } finally {
      loading = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <title>Admin Login - HelpingHand</title>
</svelte:head>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <h1>Admin Login</h1>
      <p>Access the HelpingHand admin dashboard</p>
    </div>
    
    <form on:submit|preventDefault={handleLogin}>
      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}
      
      <div class="form-group">
        <label for="username">Username</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          on:keypress={handleKeyPress}
          placeholder="Enter your username"
          disabled={loading}
          required
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          on:keypress={handleKeyPress}
          placeholder="Enter your password"
          disabled={loading}
          required
        />
      </div>
      
      <button type="submit" class="login-btn" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
    
    <div class="login-info">
      <p><strong>Demo Credentials:</strong></p>
      <p>Username: admin</p>
      <p>Password: admin123</p>
    </div>
  </div>
</div>