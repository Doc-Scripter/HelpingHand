<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let data;
  
  let showAddModal = false;
  let showEditModal = false;
  let editingProject = null;
  let newProject = {
    title: '',
    description: '',
    target_amount: ''
  };
  
  let projects = data.projects || [];
  let stats = data.stats || {};
  let recentDonations = data.recentDonations || [];
  
  async function logout() {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
      goto('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  async function addProject() {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description,
          target_amount: parseFloat(newProject.target_amount)
        })
      });
      
      if (response.ok) {
        const project = await response.json();
        projects = [project, ...projects];
        stats.totalProjects++;
        stats.activeProjects++;
        closeAddModal();
        alert('Project added successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Failed to add project');
    }
  }
  
  async function updateProject() {
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProject)
      });
      
      if (response.ok) {
        const updatedProject = await response.json();
        projects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
        closeEditModal();
        alert('Project updated successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    }
  }
  
  async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId })
      });
      
      if (response.ok) {
        projects = projects.filter(p => p.id !== projectId);
        stats.totalProjects--;
        if (projects.find(p => p.id === projectId)?.status === 'active') {
          stats.activeProjects--;
        }
        alert('Project deleted successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  }
  
  function openAddModal() {
    newProject = { title: '', description: '', target_amount: '' };
    showAddModal = true;
  }
  
  function closeAddModal() {
    showAddModal = false;
  }
  
  function openEditModal(project) {
    editingProject = { ...project };
    showEditModal = true;
  }
  
  function closeEditModal() {
    showEditModal = false;
    editingProject = null;
  }
</script>

<svelte:head>
  <title>Admin Dashboard - HelpingHand</title>
</svelte:head>

<div class="admin-dashboard">
  <header class="dashboard-header">
    <h1>Admin Dashboard</h1>
    <button class="logout-btn" on:click={logout}>Logout</button>
  </header>
  
  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total Projects</h3>
      <div class="stat-number">{stats.totalProjects}</div>
    </div>
    <div class="stat-card">
      <h3>Active Projects</h3>
      <div class="stat-number">{stats.activeProjects}</div>
    </div>
    <div class="stat-card">
      <h3>Total Donations</h3>
      <div class="stat-number">{stats.totalDonations}</div>
    </div>
    <div class="stat-card">
      <h3>Total Amount</h3>
      <div class="stat-number">KSh {stats.totalAmount?.toLocaleString() || '0'}</div>
    </div>
  </div>
  
  <!-- Projects Management -->
  <section class="projects-section">
    <div class="section-header">
      <h2>Projects Management</h2>
      <button class="add-btn" on:click={openAddModal}>Add New Project</button>
    </div>
    
    <div class="projects-table">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Target Amount</th>
            <th>Raised Amount</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each projects as project}
            <tr>
              <td>
                <div class="project-title">{project.title}</div>
                <div class="project-desc">{project.description}</div>
              </td>
              <td>KSh {project.target_amount?.toLocaleString()}</td>
              <td>KSh {project.raised_amount?.toLocaleString() || '0'}</td>
              <td>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress" style="width: {Math.min((project.raised_amount || 0) / project.target_amount * 100, 100)}%"></div>
                  </div>
                  <span class="progress-text">{Math.round((project.raised_amount || 0) / project.target_amount * 100)}%</span>
                </div>
              </td>
              <td>
                <span class="status status-{project.status}">{project.status}</span>
              </td>
              <td>
                <div class="actions">
                  <button class="edit-btn" on:click={() => openEditModal(project)}>Edit</button>
                  <button class="delete-btn" on:click={() => deleteProject(project.id)}>Delete</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
  
  <!-- Recent Donations -->
  <section class="donations-section">
    <h2>Recent Donations</h2>
    <div class="donations-table">
      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th>Amount</th>
            <th>M-Pesa Code</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {#each recentDonations as donation}
            <tr>
              <td>{donation.project_title}</td>
              <td>KSh {donation.amount?.toLocaleString()}</td>
              <td>{donation.mpesa_code || 'N/A'}</td>
              <td>{new Date(donation.created_at).toLocaleDateString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>

<!-- Add Project Modal -->
{#if showAddModal}
  <div class="modal-overlay" on:click={closeAddModal}>
    <div class="modal" on:click|stopPropagation>
      <h3>Add New Project</h3>
      <form on:submit|preventDefault={addProject}>
        <div class="form-group">
          <label for="title">Project Title</label>
          <input type="text" id="title" bind:value={newProject.title} required>
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" bind:value={newProject.description} required></textarea>
        </div>
        <div class="form-group">
          <label for="target">Target Amount (KSh)</label>
          <input type="number" id="target" bind:value={newProject.target_amount} required>
        </div>
        <div class="form-actions">
          <button type="button" class="cancel-btn" on:click={closeAddModal}>Cancel</button>
          <button type="submit" class="submit-btn">Add Project</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Project Modal -->
{#if showEditModal && editingProject}
  <div class="modal-overlay" on:click={closeEditModal}>
    <div class="modal" on:click|stopPropagation>
      <h3>Edit Project</h3>
      <form on:submit|preventDefault={updateProject}>
        <div class="form-group">
          <label for="edit-title">Project Title</label>
          <input type="text" id="edit-title" bind:value={editingProject.title} required>
        </div>
        <div class="form-group">
          <label for="edit-description">Description</label>
          <textarea id="edit-description" bind:value={editingProject.description} required></textarea>
        </div>
        <div class="form-group">
          <label for="edit-target">Target Amount (KSh)</label>
          <input type="number" id="edit-target" bind:value={editingProject.target_amount} required>
        </div>
        <div class="form-group">
          <label for="edit-status">Status</label>
          <select id="edit-status" bind:value={editingProject.status}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="cancel-btn" on:click={closeEditModal}>Cancel</button>
          <button type="submit" class="submit-btn">Update Project</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .admin-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .dashboard-header h1 {
    color: #333;
    margin: 0;
  }
  
  .logout-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .logout-btn:hover {
    background: #c82333;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .stat-card h3 {
    margin: 0 0 0.5rem 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
  }
  
  .projects-section, .donations-section {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-header h2 {
    margin: 0;
    color: #333;
  }
  
  .add-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .add-btn:hover {
    background: #218838;
  }
  
  .projects-table, .donations-table {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }
  
  th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }
  
  .project-title {
    font-weight: 600;
    color: #333;
  }
  
  .project-desc {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
  }
  
  .progress-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .progress-bar {
    flex: 1;
    background: #e9ecef;
    border-radius: 4px;
    height: 8px;
    overflow: hidden;
  }
  
  .progress {
    background: linear-gradient(90deg, #28a745, #20c997);
    height: 100%;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-size: 0.8rem;
    color: #666;
    min-width: 35px;
  }
  
  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-active {
    background: #d4edda;
    color: #155724;
  }
  
  .status-paused {
    background: #fff3cd;
    color: #856404;
  }
  
  .status-completed {
    background: #d1ecf1;
    color: #0c5460;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .edit-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .edit-btn:hover {
    background: #0056b3;
  }
  
  .delete-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  
  .delete-btn:hover {
    background: #c82333;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal h3 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 600;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-group textarea {
    height: 100px;
    resize: vertical;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
  
  .cancel-btn {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .cancel-btn:hover {
    background: #5a6268;
  }
  
  .submit-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .submit-btn:hover {
    background: #0056b3;
  }
</style>