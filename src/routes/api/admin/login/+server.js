import { json } from '@sveltejs/kit';
import db from '../../../../lib/services/database.js';

export async function POST({ request, cookies }) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return json({ error: 'Username and password are required' }, { status: 400 });
    }
    
    // Simple authentication - in production, use proper password hashing
    if (username === 'admin' && password === 'admin123') {
      // Set a simple session cookie
      cookies.set('admin_session', 'authenticated', {
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
      });
      
      return json({ success: true, message: 'Login successful' });
    }
    
    return json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Login failed' }, { status: 500 });
  }
}

export async function DELETE({ cookies }) {
  // Logout
  cookies.delete('admin_session', { path: '/' });
  return json({ success: true, message: 'Logged out successfully' });
}