-- Grant DELETE permission on auth.users to the service_role
-- This is often implicitly granted, but explicitly setting it can help debug permission issues.

GRANT DELETE ON auth.users TO service_role;
