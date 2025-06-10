<script>
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import '/static/css/global.css'; // Import your global CSS if you have one
</script>

<Navbar />

<slot />

<Footer />