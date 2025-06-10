<script>
  import { enhance } from '$app/forms';
</script>

<form method="POST" use:enhance>
  <input name="amount" type="number" required>
  <button>Donate Now</button>
</form>