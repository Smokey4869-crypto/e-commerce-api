import { CustomError } from './custom-errors';

export const Errors = {
  FetchFailed: (originalError?: string) => 
    new CustomError('FETCH_FAILED', 500, 'Cannot fetch data from the database', originalError),

  // Add more predefined errors as needed
};