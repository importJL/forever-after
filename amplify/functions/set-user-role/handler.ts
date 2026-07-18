import type { Handler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient();

const VALID_ROLES = ['admin', 'full', 'readwrite', 'readonly'];

export const handler: Handler = async (event: {
  arguments: { userId: string; role: string; userPoolId: string };
}) => {
  const { userId, role, userPoolId } = event.arguments;

  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  if (!userPoolId) {
    throw new Error('userPoolId is required');
  }

  const { Groups } = await cognitoClient.send(
    new AdminListGroupsForUserCommand({
      Username: userId,
      UserPoolId: userPoolId,
    }),
  );

  const currentGroups = Groups?.map((g) => g.GroupName!) || [];

  for (const group of currentGroups) {
    if (VALID_ROLES.includes(group)) {
      await cognitoClient.send(
        new AdminRemoveUserFromGroupCommand({
          GroupName: group,
          UserPoolId: userPoolId,
          Username: userId,
        }),
      );
    }
  }

  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      GroupName: role,
      UserPoolId: userPoolId,
      Username: userId,
    }),
  );

  return { success: true, role };
};
