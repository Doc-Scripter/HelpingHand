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

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
  }
  
  .login-card {
    background: white;
    border-radius: 12px;
    padding: 2.5rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .login-header h1 {
    color: #333;
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
  }
  
  .login-header p {
    color: #666;
    margin: 0;
  }
  
  .error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #f5c6cb;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 600;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e1e5e9;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .form-group input:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
  
  .login-btn {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .login-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .login-info {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e1e5e9;
    text-align: center;
  }
  
  .login-info p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .login-info p:first-child {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
  }
</style>