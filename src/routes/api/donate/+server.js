import { json } from '@sveltejs/kit';
import db from '../../../lib/services/database.js';

export async function POST({ request }) {
  try {
    const { project_id, amount, phone_number } = await request.json();
    
    if (!project_id || !amount || !phone_number) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (amount < 1) {
      return json({ error: 'Minimum donation amount is KSh 1' }, { status: 400 });
    }
    
    // Verify project exists and is active
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND status = ?').get(project_id, 'active');
    if (!project) {
      return json({ error: 'Project not found or inactive' }, { status: 404 });
    }
    
    // In a real implementation, you would integrate with M-Pesa API here
    // For demo purposes, we'll simulate a successful payment
    const mpesa_code = 'MP' + Date.now().toString().slice(-8);
    
    // Insert donation record
    const result = db.prepare(`
      INSERT INTO donations (amount, project_id, mpesa_code)
      VALUES (?, ?, ?)
    `).run(amount, project_id, mpesa_code);
    
    // Update project raised amount
    db.prepare(`
      UPDATE projects 
      SET raised_amount = raised_amount + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(amount, project_id);
    
    return json({
      success: true,
      donation_id: result.lastInsertRowid,
      mpesa_code,
      message: 'Donation processed successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Donation error:', error);
    return json({ error: 'Failed to process donation' }, { status: 500 });
  }
}