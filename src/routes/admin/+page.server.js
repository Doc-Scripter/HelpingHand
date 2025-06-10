import { redirect } from '@sveltejs/kit';
import db from '../../lib/services/database.js';

export async function load({ cookies }) {
  const adminSession = cookies.get('admin_session');
  
  if (!adminSession || adminSession !== 'authenticated') {
    throw redirect(302, '/admin/login');
  }
  
  // Fetch dashboard data
  try {
    const projects = db.prepare(`
      SELECT p.*, 
             COALESCE(SUM(d.amount), 0) as raised_amount,
             COUNT(d.id) as donation_count
      FROM projects p
      LEFT JOIN donations d ON p.id = d.project_id
      WHERE p.status != 'deleted'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    
    const totalDonations = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM donations
    `).get();
    
    const recentDonations = db.prepare(`
      SELECT d.*, p.title as project_title
      FROM donations d
      JOIN projects p ON d.project_id = p.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `).all();
    
    return {
      projects,
      stats: {
        totalProjects: projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        totalDonations: totalDonations.count,
        totalAmount: totalDonations.total
      },
      recentDonations
    };
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    return {
      projects: [],
      stats: { totalProjects: 0, activeProjects: 0, totalDonations: 0, totalAmount: 0 },
      recentDonations: []
    };
  }
}