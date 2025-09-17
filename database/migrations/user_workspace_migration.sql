-- Migration to support user-based workspaces instead of organizations
-- This allows the app to work without Clerk Pro plan by using user IDs as organization IDs

-- 1. Update existing data to use user IDs where clerk_org_id is null
UPDATE organizations 
SET clerk_org_id = created_by 
WHERE clerk_org_id IS NULL AND created_by IS NOT NULL;

-- 2. Create personal workspaces for users without organizations
-- This creates a personal workspace for each unique user ID found in jobs table
INSERT INTO organizations (id, clerk_org_id, name, slug, created_by, type, plan, quota_limit, quota_used, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.user_id,
  CONCAT('Personal Workspace ', u.user_id),
  CONCAT('personal-', u.user_id),
  u.user_id,
  'personal',
  'free',
  100,
  0,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT 
    COALESCE(j.user_id, j.created_by) as user_id
  FROM jobs j
  LEFT JOIN organizations o ON j.organization_id = o.id
  WHERE o.id IS NULL OR o.clerk_org_id IS NULL
) u
ON CONFLICT (clerk_org_id) DO UPDATE SET 
  updated_at = NOW(),
  type = 'personal';

-- 3. Update jobs to use user-based organization IDs
UPDATE jobs j
SET organization_id = (
  SELECT id FROM organizations 
  WHERE clerk_org_id = COALESCE(j.user_id, j.created_by)
  LIMIT 1
)
WHERE organization_id IS NULL OR organization_id NOT IN (
  SELECT id FROM organizations WHERE clerk_org_id IS NOT NULL
);

-- 4. Ensure all users have personal workspaces
-- Create personal workspaces for any remaining users without organizations
INSERT INTO organizations (id, clerk_org_id, name, slug, created_by, type, plan, quota_limit, quota_used, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.user_id,
  CONCAT('Personal Workspace ', u.user_id),
  CONCAT('personal-', u.user_id),
  u.user_id,
  'personal',
  'free',
  100,
  0,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT 
    COALESCE(j.user_id, j.created_by) as user_id
  FROM jobs j
  WHERE NOT EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.clerk_org_id = COALESCE(j.user_id, j.created_by)
  )
) u
ON CONFLICT (clerk_org_id) DO NOTHING;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON jobs(organization_id);

-- 6. Update any remaining NULL values
UPDATE organizations 
SET clerk_org_id = id::text 
WHERE clerk_org_id IS NULL;

-- 7. Verify migration results
SELECT 
  'Migration Summary' as status,
  COUNT(*) as total_organizations,
  COUNT(CASE WHEN type = 'personal' THEN 1 END) as personal_workspaces,
  COUNT(CASE WHEN clerk_org_id IS NOT NULL THEN 1 END) as with_clerk_org_id
FROM organizations;

SELECT 
  'Jobs Summary' as status,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_organization_id,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id
FROM jobs;