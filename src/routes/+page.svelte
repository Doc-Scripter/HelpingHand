<script>
  import { onMount } from 'svelte';
  
  /** @type {any[]} */
  let projects = [];
  let loading = true;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/projects');
      projects = await response.json();
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>HelpingHand - Anonymous Donations</title>
</svelte:head>

<div class="hero">
  <h1>HelpingHand</h1>
  <p>Support social projects through anonymous donations</p>
</div>

<section class="projects">
  <h2>Active Projects</h2>
  
  {#if loading}
    <div class="loading">Loading projects...</div>
  {:else if projects.length === 0}
    <div class="no-projects">No active projects at the moment.</div>
  {:else}
    <div class="project-grid">
      {#each projects as project}
        <div class="project-card">
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <div class="project-meta">
            <span class="target">Target: KSh {project.target_amount?.toLocaleString() || 'N/A'}</span>
            <span class="raised">Raised: KSh {project.raised_amount?.toLocaleString() || '0'}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: {Math.min((project.raised_amount || 0) / (project.target_amount || 1) * 100, 100)}%"></div>
          </div>
          <a href="/donate/{project.id}" class="donate-btn">Donate Now</a>
        </div>
      {/each}
    </div>
  {/if}
</section>