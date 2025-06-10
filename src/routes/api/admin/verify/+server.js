import { json } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { password } = await request.json();
    
    // Verify the password against the environment variable
    const isValid = password === ADMIN_PASSWORD;
    
    if (isValid) {
      return json({ 
        success: true, 
        message: 'Admin authentication successful' 
      });
    } else {
      return json({ 
        success: false, 
        message: 'Invalid admin password' 
      }, { status: 401 });
    }
  } catch (error) {
    return json({ 
      success: false, 
      message: 'Authentication error' 
    }, { status: 500 });
  }
}