/**
 * Toast utility for displaying human-readable notifications using Sonner
 * Handles backend error parsing and provides consistent toast styling
 */

import { toast } from 'sonner';

// Map of backend error codes/keys to human-readable messages
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'invalid_credentials': 'Invalid username or password',
  'token_not_valid': 'Your session has expired. Please log in again.',
  'authentication_failed': 'Authentication failed. Please try again.',
  'no_active_account': 'No active account found with these credentials',
  'user_not_found': 'User not found',
  'user_inactive': 'This account is inactive. Please contact support.',
  'password_mismatch': 'The passwords do not match',
  'password_too_short': 'Password must be at least 8 characters',
  'password_too_common': 'This password is too common. Please choose a stronger one.',
  
  // Permission errors
  'permission_denied': 'You do not have permission to perform this action',
  'not_authenticated': 'Please log in to continue',
  'forbidden': 'Access denied',
  
  // Validation errors
  'required': 'This field is required',
  'blank': 'This field cannot be blank',
  'invalid': 'Invalid value provided',
  'unique': 'This value already exists',
  'does_not_exist': 'The requested item was not found',
  'max_length': 'This value is too long',
  'min_length': 'This value is too short',
  'invalid_email': 'Please enter a valid email address',
  'invalid_phone': 'Please enter a valid phone number',
  
  // Event errors
  'event_not_found': 'Event not found',
  'event_ended': 'This event has already ended',
  'event_not_started': 'This event has not started yet',
  
  // Guest errors
  'guest_not_found': 'Guest not found',
  'guest_already_checked_in': 'This guest has already checked in',
  'guest_not_invited': 'This guest is not on the invite list',
  'duplicate_guest': 'A guest with this email already exists',
  
  // QR Code errors
  'invalid_qr_code': 'Invalid QR code',
  'qr_code_expired': 'This QR code has expired',
  'qr_code_used': 'This QR code has already been used',
  
  // Network errors
  'network_error': 'Unable to connect to the server. Please check your internet connection.',
  'server_error': 'Something went wrong on our end. Please try again later.',
  'timeout': 'The request timed out. Please try again.',
  
  // Generic
  'unknown_error': 'An unexpected error occurred. Please try again.',
};

// Field name mappings for more readable error messages
const FIELD_NAMES: Record<string, string> = {
  'username': 'Username',
  'password': 'Password',
  'email': 'Email',
  'first_name': 'First name',
  'last_name': 'Last name',
  'phone': 'Phone number',
  'phone_number': 'Phone number',
  'name': 'Name',
  'title': 'Title',
  'description': 'Description',
  'date': 'Date',
  'start_date': 'Start date',
  'end_date': 'End date',
  'start_time': 'Start time',
  'end_time': 'End time',
  'location': 'Location',
  'venue': 'Venue',
  'address': 'Address',
  'city': 'City',
  'country': 'Country',
  'organization': 'Organization',
  'event': 'Event',
  'guest': 'Guest',
  'activity': 'Activity',
  'non_field_errors': 'Error',
  'detail': 'Error',
};

/**
 * Parse backend error response into human-readable messages
 */
export function parseBackendError(error: unknown): string {
  // Handle string errors
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error.toLowerCase()] || error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return ERROR_MESSAGES['network_error'];
    }
    return error.message;
  }

  // Handle API error responses
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // Check for response.data pattern (axios-like)
    if ('response' in errorObj && typeof errorObj.response === 'object') {
      const response = errorObj.response as Record<string, unknown>;
      if ('data' in response) {
        return parseBackendError(response.data);
      }
    }

    // Check for direct error data
    if ('data' in errorObj) {
      return parseBackendError(errorObj.data);
    }

    // Handle Django REST Framework error format
    // { "field_name": ["error message", ...] }
    const messages: string[] = [];
    
    for (const [key, value] of Object.entries(errorObj)) {
      const fieldName = FIELD_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      
      if (Array.isArray(value)) {
        // Array of error messages
        value.forEach((msg) => {
          if (typeof msg === 'string') {
            const readableMsg = ERROR_MESSAGES[msg.toLowerCase()] || msg;
            if (key === 'non_field_errors' || key === 'detail') {
              messages.push(readableMsg);
            } else {
              messages.push(`${fieldName}: ${readableMsg}`);
            }
          }
        });
      } else if (typeof value === 'string') {
        const readableMsg = ERROR_MESSAGES[value.toLowerCase()] || value;
        if (key === 'non_field_errors' || key === 'detail' || key === 'error') {
          messages.push(readableMsg);
        } else {
          messages.push(`${fieldName}: ${readableMsg}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object errors
        messages.push(parseBackendError(value));
      }
    }

    if (messages.length > 0) {
      return messages.join('\n');
    }
  }

  return ERROR_MESSAGES['unknown_error'];
}

/**
 * Show a success toast
 */
export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show an error toast with parsed backend error
 */
export function showError(error: unknown, fallbackMessage?: string) {
  const message = parseBackendError(error) || fallbackMessage || 'An error occurred';
  toast.error('Error', {
    description: message,
    duration: 6000,
  });
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 5000,
  });
}

/**
 * Show an info toast
 */
export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Show a loading toast that can be updated
 */
export function showLoading(message: string) {
  return toast.loading(message);
}

/**
 * Dismiss a toast by ID
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

/**
 * Show a promise toast for async operations
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: (err) => {
      if (typeof messages.error === 'function') {
        return messages.error(err);
      }
      return parseBackendError(err) || messages.error;
    },
  });
}

// Export for convenience
export { toast };
