import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userName, userPoolId } = event;

  try {
    const { Users } = await cognitoClient.send(
      new ListUsersInGroupCommand({
        UserPoolId: userPoolId,
        GroupName: 'admin',
        Limit: 1,
      }),
    );

    const isFirstUser = !Users || Users.length === 0;
    const role = isFirstUser ? 'admin' : 'readwrite';

    await cognitoClient.send(
      new AdminAddUserToGroupCommand({
        GroupName: role,
        UserPoolId: userPoolId,
        Username: userName,
      }),
    );
  } catch (err) {
    console.error('post-confirmation error:', err);
  }

  return event;
};
