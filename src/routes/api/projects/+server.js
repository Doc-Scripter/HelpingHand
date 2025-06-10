import { json } from '@sveltejs/kit';
import db from '../../../lib/services/database.js';

export async function GET() {
  try {
    const projects = db.prepare(`
      SELECT p.*, 
             COALESCE(SUM(d.amount), 0) as raised_amount
      FROM projects p
      LEFT JOIN donations d ON p.id = d.project_id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    
    return json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const { title, description, target_amount } = await request.json();
    
    if (!title || !description || !target_amount) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const id = 'proj-' + Date.now();
    
    db.prepare(`
      INSERT INTO projects (id, title, description, target_amount)
      VALUES (?, ?, ?, ?)
    `).run(id, title, description, target_amount);
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    
    return json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT({ request }) {
  try {
    const { id, title, description, target_amount, status } = await request.json();
    
    if (!id) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    db.prepare(`
      UPDATE projects 
      SET title = ?, description = ?, target_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, target_amount, status, id);
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    
    if (!project) {
      return json({ error: 'Project not found' }, { status: 404 });
    }
    
    return json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE({ request }) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    // Soft delete by setting status to 'deleted'
    const result = db.prepare(`
      UPDATE projects 
      SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);
    
    if (result.changes === 0) {
      return json({ error: 'Project not found' }, { status: 404 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return json({ error: 'Failed to delete project' }, { status: 500 });
  }
}