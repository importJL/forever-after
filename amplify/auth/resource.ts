import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['admin', 'full', 'readwrite', 'readonly'],
  triggers: {
    postConfirmation,
  },
});
