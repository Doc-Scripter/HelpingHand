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
        const donationAmount = parseFloat(amount);
        // Reset form
        amount = '';
        phoneNumber = '';
        // Update raised amount
        project.raised_amount = (project.raised_amount || 0) + donationAmount;
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
  
  /**
   * @param {string} text
   * @param {string} type
   */
  function showMessage(text, type) {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
      messageType = '';
    }, 5000);
  }
  
  /**
   * @param {string} value
   * @returns {string}
   */
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
  
  /**
   * @param {Event} event
   */
  function handlePhoneInput(event) {
    const target = /** @type {HTMLInputElement} */ (event.target);
    phoneNumber = formatPhoneNumber(target.value);
  }
  
  $: progressPercentage = Math.min((project.raised_amount || 0) / (project.target_amount || 1) * 100, 100);
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