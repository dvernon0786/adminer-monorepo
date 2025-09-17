// User Workspace Middleware
// Maps user ID to organization ID for database queries

export const userWorkspaceMiddleware = (req: any, res: any, next: any) => {
  const userId = req.headers['x-user-id'];
  const workspaceId = req.headers['x-workspace-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      success: false,
      error: 'User ID required',
      code: 'USER_ID_REQUIRED'
    });
  }
  
  // Use user ID as organization ID for database queries
  req.organizationId = userId; // Map user ID to organization ID
  req.workspaceId = workspaceId || userId;
  req.userId = userId;
  
  console.log('API: Using user workspace -', { userId, workspaceId });
  
  next();
};

// Helper function to get organization ID from user ID
export const getOrganizationIdFromUser = (userId: string): string => {
  // For personal workspaces, user ID becomes the organization ID
  return userId;
};

// Helper function to create personal workspace data
export const createPersonalWorkspaceData = (userId: string, userEmail?: string) => {
  return {
    id: userId,
    clerk_org_id: userId, // Use user ID as clerk_org_id
    name: `${userEmail || 'Personal'} Workspace`,
    slug: `personal-${userId}`,
    created_by: userId,
    type: 'personal',
    plan: 'free',
    quota_limit: 100,
    quota_used: 0
  };
};