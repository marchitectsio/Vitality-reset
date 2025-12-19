/**
 * Sanitizes database errors to prevent information leakage
 * Maps technical error codes to user-friendly messages
 */
export function handleDatabaseError(error: any, context: string): string {
  // Log full error for debugging (server-side only in production)
  if (import.meta.env.DEV) {
    console.error(`Database error in ${context}:`, error);
  }

  // Map PostgreSQL error codes to user-friendly messages
  const errorCode = error?.code;
  
  switch (errorCode) {
    case '23505': // unique_violation
      return 'This action has already been completed.';
    
    case '23503': // foreign_key_violation
      return 'Referenced data no longer exists.';
    
    case '23502': // not_null_violation
      return 'Required information is missing.';
    
    case '42501': // insufficient_privilege
      return 'You do not have permission to perform this action.';
    
    case 'PGRST116': // JWT expired
      return 'Your session has expired. Please sign in again.';
    
    case 'PGRST301': // Row level security violation
      return 'You do not have access to this resource.';
    
    default:
      // Generic error for all other cases
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Handles authentication errors specifically
 * Surfaces server error messages when available
 */
export function handleAuthError(error: any): string {
  if (import.meta.env.DEV) {
    console.error('Auth error:', error);
  }

  // Check for server error message first (from response body)
  const serverMessage = error?.error || error?.message || '';
  const lowerMessage = serverMessage.toLowerCase();
  
  // Handle specific server messages
  if (lowerMessage.includes('email already registered') || lowerMessage.includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  
  if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid email or password')) {
    return 'Invalid email or password.';
  }
  
  if (lowerMessage.includes('email not confirmed')) {
    return 'Please confirm your email address.';
  }
  
  if (lowerMessage.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (lowerMessage.includes('required')) {
    return serverMessage;
  }
  
  // If server provided a specific message, use it
  if (serverMessage && serverMessage.length > 0 && serverMessage.length < 100) {
    return serverMessage;
  }
  
  return 'Authentication failed. Please try again.';
}
