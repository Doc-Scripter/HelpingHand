import db from '../../lib/services/database.js';

export async function load() {
  try {
    const projects = db.prepare(`
      SELECT p.*, 
             COALESCE(SUM(d.amount), 0) as raised_amount,
             ROUND((COALESCE(SUM(d.amount), 0) / p.target_amount) * 100, 2) as progress_percentage,
             (p.target_amount - COALESCE(SUM(d.amount), 0)) as remaining_amount
      FROM projects p
      LEFT JOIN donations d ON p.id = d.project_id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

    // Add urgency rating based on progress percentage
    const projectsWithUrgency = projects.map(project => ({
      ...project,
      urgency: project.progress_percentage < 25 ? 'high' : 
               project.progress_percentage < 60 ? 'mid' : 'low'
    }));

    return {
      projects: projectsWithUrgency
    };
  } catch (error) {
    console.error('Error loading projects:', error);
    return {
      projects: []
    };
  }
}