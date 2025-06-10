import db from '$lib/services/database';

export const POST = async ({ request }) => {
  const { amount, projectId } = await request.json();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO donations (amount, project_id) 
      VALUES (?, ?)
    `);
    
    const result = stmt.run(amount, projectId);

    return new Response(JSON.stringify({
      id: result.lastInsertRowid,
      status: 'pending'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Database storage failed'
    }), {
      status: 500
    });
  }
};