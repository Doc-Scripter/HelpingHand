<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let data;
  
  let showAddModal = false;
  let showEditModal = false;
  
  /** @type {any} */
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
    if (!editingProject) return;
    
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProject)
      });
      
      if (response.ok) {
        const updatedProject = await response.json();
        projects = projects.map(/** @param {any} p */ (p) => p.id === updatedProject.id ? updatedProject : p);
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
  
  /**
   * @param {string} projectId
   */
  async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId })
      });
      
      if (response.ok) {
        projects = projects.filter(/** @param {any} p */ (p) => p.id !== projectId);
        stats.totalProjects--;
        const deletedProject = projects.find(/** @param {any} p */ (p) => p.id === projectId);
        if (deletedProject?.status === 'active') {
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
  
  /**
   * @param {any} project
   */
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