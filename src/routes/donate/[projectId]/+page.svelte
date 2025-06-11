<script>  
  export let data;
  
  let project = data.project;
  let amount = '';
  let phoneNumber = '';
  let loading = false;
  let message = '';
  let messageType = '';
  let checkoutRequestId = '';
  let showStatusCheck = false;
  /** @type {number | undefined} */
  let statusCheckInterval;

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
      
      if (response.ok && result.success) {
        if (result.simulation) {
          // Simulation mode - payment completed immediately
          showMessage('Donation processed successfully! (Demo mode)', 'success');
          const donationAmount = parseFloat(amount);
          amount = '';
          phoneNumber = '';
          project.raised_amount = (project.raised_amount || 0) + donationAmount;
        } else {
          // Real M-Pesa - show STK Push instructions
          showMessage(result.message + ' ' + (result.instructions || ''), 'info');
          checkoutRequestId = result.checkoutRequestId;
          showStatusCheck = true;
          startStatusChecking();
        }
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

  function startStatusChecking() {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    // Check status every 5 seconds for up to 2 minutes
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes
    
    statusCheckInterval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(statusCheckInterval);
        showMessage('Payment status check timed out. Please contact support if payment was deducted.', 'warning');
        showStatusCheck = false;
        return;
      }
      
      try {
        const response = await fetch(`/api/mpesa?checkout_request_id=${checkoutRequestId}`);
        const result = await response.json();
        
        if (result.success && result.localTransaction) {
          const transaction = result.localTransaction;
          
          if (transaction.status === 'completed') {
            clearInterval(statusCheckInterval);
            showMessage('Payment completed successfully! Thank you for your donation.', 'success');
            showStatusCheck = false;
            
            // Update project amount and reset form
            const donationAmount = parseFloat(amount);
            amount = '';
            phoneNumber = '';
            project.raised_amount = (project.raised_amount || 0) + donationAmount;
            
          } else if (transaction.status === 'failed' || transaction.status === 'timeout') {
            clearInterval(statusCheckInterval);
            showMessage(`Payment ${transaction.status}: ${transaction.failure_reason || 'Please try again.'}`, 'error');
            showStatusCheck = false;
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000);
  }

  function cancelStatusCheck() {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    showStatusCheck = false;
    showMessage('Status checking cancelled. Payment may still be processing.', 'info');
  }

  /**
   * @param {string} text
   * @param {string} type
   */
  function showMessage(text, type) {
    message = text;
    messageType = type;
    setTimeout(() => {
      if (messageType !== 'info') { // Keep info messages longer
        message = '';
        messageType = '';
      }
    }, type === 'info' ? 10000 : 5000);
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

  // Cleanup interval on component destroy
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
  });
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

    {#if showStatusCheck}
      <div class="status-check">
        <div class="status-check-header">
          <h3>🔄 Checking Payment Status</h3>
          <p>Please complete the M-Pesa payment on your phone. We're monitoring the transaction status...</p>
        </div>
        <div class="status-check-actions">
          <button type="button" class="cancel-status-btn" on:click={cancelStatusCheck}>
            Cancel Status Check
          </button>
        </div>
      </div>
    {:else}
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
    {/if}
    
    <div class="donation-info">
      <h3>How M-Pesa donation works:</h3>
      <ol>
        <li>Enter your donation amount and M-Pesa phone number</li>
        <li>Click "Donate" to initiate the payment</li>
        <li>You'll receive an M-Pesa prompt on your phone within 30 seconds</li>
        <li>Enter your M-Pesa PIN to complete the donation</li>
        <li>You'll receive an SMS confirmation from M-Pesa</li>
        <li>Your donation is anonymous and secure</li>
      </ol>
      
      <div class="mpesa-info">
        <h4>M-Pesa Tips:</h4>
        <ul>
          <li>Ensure your phone has network coverage</li>
          <li>Make sure you have sufficient M-Pesa balance</li>
          <li>The payment prompt expires after 30 seconds</li>
          <li>You can retry if the payment fails</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<div class="back-link">
  <a href="/projects">Back to Projects</a>
</div>