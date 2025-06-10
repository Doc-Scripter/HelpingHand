<script>
  import { goto } from '$app/navigation';
  
  export let data;
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  function getUrgencyClass(urgency) {
    switch(urgency) {
      case 'high': return 'urgency-high';
      case 'mid': return 'urgency-mid';
      default: return 'urgency-low';
    }
  }
  
  function handleLearnMore(projectId) {
    goto(`/donate/${projectId}`);
  }
  
  function handleDonate(projectId) {
    goto(`/donate/${projectId}#donate-form`);
  }
</script>

<svelte:head>
  <title>Projects - HelpingHand</title>
  <meta name="description" content="Browse and support community projects across Kenya. Help make a difference in education, healthcare, water access, and more." />
</svelte:head>

<div class="projects-page">
  <div class="hero-section">
    <div class="container">
      <h1>Community Projects</h1>
      <p>Discover meaningful projects across Kenya and help make a lasting impact in communities that need it most.</p>
    </div>
  </div>

  <div class="container">
    <div class="projects-stats">
      <div class="stat-card">
        <h3>{data.projects.length}</h3>
        <p>Active Projects</p>
      </div>
      <div class="stat-card">
        <h3>{data.projects.reduce((sum, p) => sum + p.beneficiaries_count, 0).toLocaleString()}</h3>
        <p>People Helped</p>
      </div>
      <div class="stat-card">
        <h3>{formatCurrency(data.projects.reduce((sum, p) => sum + p.raised_amount, 0))}</h3>
        <p>Total Raised</p>
      </div>
    </div>

    <div class="projects-grid">
      {#each data.projects as project}
        <div class="project-card">
          <div class="project-image">
            <img src={project.image_url || '/images/default-project.jpg'} alt={project.title} />
            <div class="urgency-badge {getUrgencyClass(project.urgency)}">
              {project.urgency.toUpperCase()} PRIORITY
            </div>
          </div>
          
          <div class="project-content">
            <div class="project-header">
              <h3 class="project-title">{project.title}</h3>
              <div class="project-meta">
                <span class="category">{project.category}</span>
                <span class="county">{project.county}</span>
              </div>
            </div>
            
            <p class="project-description">{project.description}</p>
            
            <div class="project-stats">
              <div class="stat">
                <span class="label">People Counting On This:</span>
                <span class="value">{project.beneficiaries_count.toLocaleString()}</span>
              </div>
              
              <div class="funding-info">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {Math.min(project.progress_percentage, 100)}%"></div>
                </div>
                <div class="funding-stats">
                  <div class="stat">
                    <span class="label">Raised:</span>
                    <span class="value">{formatCurrency(project.raised_amount)}</span>
                  </div>
                  <div class="stat">
                    <span class="label">Remaining:</span>
                    <span class="value">{formatCurrency(project.remaining_amount)}</span>
                  </div>
                  <div class="stat">
                    <span class="label">Goal:</span>
                    <span class="value">{formatCurrency(project.target_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="project-footer">
              <div class="date-created">
                Created: {formatDate(project.created_at)}
              </div>
              <div class="project-actions">
                <button 
                  class="btn btn-secondary" 
                  on:click={() => handleLearnMore(project.id)}
                >
                  Learn More
                </button>
                <button 
                  class="btn btn-primary" 
                  on:click={() => handleDonate(project.id)}
                >
                  Donate Now
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if data.projects.length === 0}
      <div class="no-projects">
        <h3>No Active Projects</h3>
        <p>There are currently no active projects. Please check back later.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .projects-page {
    min-height: 100vh;
    background-color: #f8f9fa;
  }

  .hero-section {
    background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    color: white;
    padding: 4rem 0;
    text-align: center;
  }

  .hero-section h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .hero-section p {
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    opacity: 0.9;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .projects-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin: 3rem 0;
  }

  .stat-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
  }

  .stat-card h3 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-weight: 700;
  }

  .stat-card p {
    color: #6c757d;
    font-size: 1.1rem;
    margin: 0;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .project-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid #e9ecef;
  }

  .project-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
  }

  .project-image {
    position: relative;
    height: 250px;
    overflow: hidden;
  }

  .project-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  }

  .project-image img[src=""], 
  .project-image img:not([src]) {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .project-image img[src=""]:after, 
  .project-image img:not([src]):after {
    content: "📷";
    font-size: 3rem;
    color: white;
    opacity: 0.7;
  }

  .project-card:hover .project-image img {
    transform: scale(1.05);
  }

  .urgency-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .urgency-high {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
  }

  .urgency-mid {
    background: linear-gradient(135deg, #f39c12, #e67e22);
  }

  .urgency-low {
    background: linear-gradient(135deg, #27ae60, #229954);
  }

  .project-content {
    padding: 2rem;
  }

  .project-header {
    margin-bottom: 1rem;
  }

  .project-title {
    font-size: 1.5rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .project-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .category, .county {
    background: #f8f9fa;
    color: #495057;
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.9rem;
    font-weight: 500;
    border: 1px solid #dee2e6;
  }

  .category {
    background: #e3f2fd;
    color: #1976d2;
    border-color: #bbdefb;
  }

  .project-description {
    color: #6c757d;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .project-stats {
    margin-bottom: 1.5rem;
  }

  .stat {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .stat .label {
    color: #6c757d;
    font-weight: 500;
  }

  .stat .value {
    color: #2c3e50;
    font-weight: 600;
  }

  .funding-info {
    margin-top: 1rem;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2980b9);
    transition: width 0.3s ease;
  }

  .funding-stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  .funding-stats .stat {
    flex-direction: column;
    text-align: center;
    margin-bottom: 0;
  }

  .funding-stats .label {
    font-size: 0.9rem;
    margin-bottom: 0.2rem;
  }

  .funding-stats .value {
    font-size: 0.95rem;
  }

  .project-footer {
    border-top: 1px solid #e9ecef;
    padding-top: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .date-created {
    color: #6c757d;
    font-size: 0.9rem;
  }

  .project-actions {
    display: flex;
    gap: 0.8rem;
  }

  .btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    font-size: 0.9rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #2980b9, #21618c);
    transform: translateY(-2px);
  }

  .btn-secondary {
    background: #f8f9fa;
    color: #495057;
    border: 1px solid #dee2e6;
  }

  .btn-secondary:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }

  .no-projects {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .no-projects h3 {
    color: #6c757d;
    margin-bottom: 1rem;
  }

  .no-projects p {
    color: #adb5bd;
  }

  @media (max-width: 768px) {
    .hero-section h1 {
      font-size: 2rem;
    }

    .hero-section p {
      font-size: 1rem;
    }

    .projects-grid {
      grid-template-columns: 1fr;
    }

    .project-content {
      padding: 1.5rem;
    }

    .funding-stats {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .project-footer {
      flex-direction: column;
      align-items: stretch;
    }

    .project-actions {
      justify-content: center;
    }
  }
</style>