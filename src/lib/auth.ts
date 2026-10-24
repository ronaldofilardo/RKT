export { getRLSUser } from './rls-context';

export {
  getUserFromRequestScoped,
  isRole,
  VALID_ROLES,
} from './auth-credentials.logic';
export { getUserFromRequest } from './auth-credentials.logic';

export {
  ROLE_HIERARCHY,
  requireRole,
  withRLSHandler,
} from './auth-role.logic';

export {
  ROLE_PERMISSIONS,
  hasPermission,
  requirePermission,
  withPermissionHandler,
  type AppAction,
} from './auth-permissions.logic';
