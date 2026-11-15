import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/api';
import { applyApiFieldErrors } from '@/utils/forms';

describe('applyApiFieldErrors', () => {
  it('sets the first server message per field, typed with the backend code', () => {
    const setError = vi.fn();
    const error = new ApiError('validation', {
      status: 400,
      fieldErrors: [
        { field: 'phone', code: 'REQUIRED_FIELD', message: 'Required' },
        { field: 'phone', code: 'INVALID_VALUE', message: 'Ignored' },
        { field: 'name', code: 'INVALID_VALUE', message: 'Bad' },
      ],
    });
    applyApiFieldErrors(error, setError);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith('phone', { type: 'REQUIRED_FIELD', message: 'Required' });
    expect(setError).toHaveBeenCalledWith('name', { type: 'INVALID_VALUE', message: 'Bad' });
  });
});
