import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './auth/post-confirmation/resource';
import { setUserRole } from './functions/set-user-role/resource';

const backend = defineBackend({
  auth,
  data,
  postConfirmation,
  setUserRole,
});

const userPoolArn = backend.auth.resources.userPool.userPoolArn;

backend.postConfirmation.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:ListUsersInGroup',
    ],
    resources: ['*'],
  }),
);

backend.setUserRole.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminRemoveUserFromGroup',
      'cognito-idp:AdminListGroupsForUser',
    ],
    resources: [userPoolArn],
  }),
);
