<script>
  import { goto } from '$app/navigation';
  
  export let data;
  
  let project = data.project;
  let amount = '';
  let phoneNumber = '';
  let loading = false;
  let message = '';
  let messageType = '';
  
  async function handleDonation() {
    if (!amount || !phoneNumber) {
      showMessage('Please enter both amount and phone number', 'error');
      return;
    }
    
    if (parseFloat(amount) < 1) {
      showMessage('Minimum donation amount is KSh 1', 'error');
      return;
    }
    
    loading = true;
    message = '';
    
    try {
      const response = await fetch('/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: project.id,
          amount: parseFloat(amount),
          phone_number: phoneNumber
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showMessage('Donation initiated successfully! Please check your phone for M-Pesa prompt.', 'success');
        // Reset form
        amount = '';
        phoneNumber = '';
        // Update raised amount
        project.raised_amount = (project.raised_amount || 0) + parseFloat(amount);
      } else {
        showMessage(result.error || 'Donation failed', 'error');
      }
    } catch (err) {
      showMessage('Network error. Please try again.', 'error');
      console.error('Donation error:', err);
    } finally {
      loading = false;
    }
  }
  
  function showMessage(text, type) {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
      messageType = '';
    }, 5000);
  }
  
  function formatPhoneNumber(value) {
    // Remove non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Format as Kenyan number
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }
  
  function handlePhoneInput(event) {
    phoneNumber = formatPhoneNumber(event.target.value);
  }
  
  $: progressPercentage = Math.min((project.raised_amount || 0) / project.target_amount * 100, 100);
</script>

<svelte:head>
  <title>Donate to {project.title} - HelpingHand</title>
</svelte:head>

<div class="donate-page">
  <div class="project-info">
    <h1>{project.title}</h1>
    <p class="project-description">{project.description}</p>
    
    <div class="progress-section">
      <div class="progress-stats">
        <div class="stat">
          <span class="label">Target:</span>
          <span class="value">KSh {project.target_amount?.toLocaleString()}</span>
        </div>
        <div class="stat">
          <span class="label">Raised:</span>
          <span class="value">KSh {project.raised_amount?.toLocaleString() || '0'}</span>
        </div>
        <div class="stat">
          <span class="label">Progress:</span>
          <span class="value">{Math.round(progressPercentage)}%</span>
        </div>
      </div>
      
      <div class="progress-bar">
        <div class="progress" style="width: {progressPercentage}%"></div>
      </div>
    </div>
  </div>
  
  <div class="donation-form">
    <h2>Make a Donation</h2>
    <p>Your donation will help make a difference. All donations are anonymous.</p>
    
    {#if message}
      <div class="message message-{messageType}">
        {message}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleDonation}>
      <div class="form-group">
        <label for="amount">Donation Amount (KSh)</label>
        <input
          type="number"
          id="amount"
          bind:value={amount}
          placeholder="Enter amount"
          min="1"
          step="1"
          disabled={loading}
          required
        />
      </div>
      
      <div class="form-group">
        <label for="phone">M-Pesa Phone Number</label>
        <input
          type="tel"
          id="phone"
          on:input={handlePhoneInput}
          placeholder="0712345678"
          disabled={loading}
          required
        />
        <small>Enter your M-Pesa registered phone number</small>
      </div>
      
      <button type="submit" class="donate-btn" disabled={loading}>
        {loading ? 'Processing...' : `Donate KSh ${amount || '0'}`}
      </button>
    </form>
    
    <div class="donation-info">
      <h3>How it works:</h3>
      <ol>
        <li>Enter your donation amount and M-Pesa number</li>
        <li>Click "Donate" to initiate the payment</li>
        <li>You'll receive an M-Pesa prompt on your phone</li>
        <li>Enter your M-Pesa PIN to complete the donation</li>
        <li>Your donation is anonymous and secure</li>
      </ol>
    </div>
  </div>
</div>

<div class="back-link">
  <a href="/">← Back to Projects</a>
</div>

<style>
  .donate-page {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  @media (max-width: 768px) {
    .donate-page {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
  
  .project-info {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    height: fit-content;
  }
  
  .project-info h1 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  .project-description {
    color: #666;
    line-height: 1.6;
    margin-bottom: 2rem;
  }
  
  .progress-section {
    margin-top: 2rem;
  }
  
  .progress-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .stat {
    text-align: center;
  }
  
  .stat .label {
    display: block;
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .stat .value {
    display: block;
    font-size: 1.1rem;
    font-weight: bold;
    color: #333;
  }
  
  .progress-bar {
    background: #e9ecef;
    border-radius: 8px;
    height: 12px;
    overflow: hidden;
  }
  
  .progress {
    background: linear-gradient(90deg, #28a745, #20c997);
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .donation-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    height: fit-content;
  }
  
  .donation-form h2 {
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .donation-form > p {
    color: #666;
    margin-bottom: 2rem;
  }
  
  .message {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .message-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .message-error {
    background: #f8d7da;
    color: #721c24;
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
    border-color: #007bff;
  }
  
  .form-group input:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
  
  .form-group small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.9rem;
  }
  
  .donate-btn {
    width: 100%;
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 6px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
    margin-bottom: 2rem;
  }
  
  .donate-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  .donate-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .donation-info {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 6px;
  }
  
  .donation-info h3 {
    color: #333;
    margin-bottom: 1rem;
  }
  
  .donation-info ol {
    color: #666;
    line-height: 1.6;
  }
  
  .donation-info li {
    margin-bottom: 0.5rem;
  }
  
  .back-link {
    margin-top: 2rem;
    text-align: center;
  }
  
  .back-link a {
    color: #007bff;
    text-decoration: none;
    font-weight: 600;
  }
  
  .back-link a:hover {
    text-decoration: underline;
  }
</style>