import { error } from '@sveltejs/kit';
import db from '../../../lib/services/database.js';

export async function load({ params }) {
  const { projectId } = params;
  
  try {
    const project = db.prepare(`
      SELECT p.*, 
             COALESCE(SUM(d.amount), 0) as raised_amount
      FROM projects p
      LEFT JOIN donations d ON p.id = d.project_id
      WHERE p.id = ? AND p.status = 'active'
      GROUP BY p.id
    `).get(projectId);
    
    if (!project) {
      throw error(404, 'Project not found');
    }
    
    return {
      project
    };
  } catch (err) {
    console.error('Error loading project:', err);
    throw error(500, 'Failed to load project');
  }
}