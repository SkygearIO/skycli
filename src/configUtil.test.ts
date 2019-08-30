import { currentCLIContext } from './configUtil';
import {
  GlobalConfig,
  ClusterUserConfig,
  ClusterConfig,
  ConfigContext,
  UserContext
} from './types';
import { Arguments } from './util';
import { decodeUser, decodeIdentity } from '@skygear/node-client';

// fixture
const clusterConfigMap: { [map: string]: ClusterConfig } = {
  server1: {
    env: 'cloud',
    endpoint: 'http://endpoint',
    api_key: 'server1key'
  },
  server2: {
    env: 'enterprise',
    endpoint: 'http://endpoint2',
    api_key: 'server2key'
  }
};

const userMap: { [map: string]: ClusterUserConfig } = {
  user1: {
    user: {
      id: 'user_id1',
      created_at: '1970-01-01T00:00:00.000Z',
      last_login_at: '1970-01-01T00:00:00.000Z',
      is_verified: 'false',
      is_disabled: 'false',
      metadata: {}
    },
    identity: {
      id: 'identityid1',
      type: 'password',
      login_id: 'email',
      login_id_key: 'user1@skygear.io',
      realm: 'default',
      claims: {}
    },
    access_token: 'access_token'
  },
  user2: {
    user: {
      id: 'user_id2',
      created_at: '1970-01-01T00:00:00.000Z',
      last_login_at: '1970-01-01T00:00:00.000Z',
      is_verified: 'false',
      is_disabled: 'false',
      metadata: {}
    },
    identity: {
      id: 'identityid2',
      type: 'password',
      login_id: 'email',
      login_id_key: 'user2@skygear.io',
      realm: 'default',
      claims: {}
    },
    access_token: 'access_token2'
  }
};

const contextMap: { [map: string]: ConfigContext } = {
  context1: {
    user: 'user1',
    cluster: 'server1'
  },
  context2: {
    user: 'user2',
    cluster: 'server2'
  },
  unknown_context: {
    user: 'nonexistent',
    cluster: 'nonexistent'
  }
};

test('currentCLIContext with context1', async () => {
  const fixture: GlobalConfig = {
    cluster: clusterConfigMap,
    context: contextMap,
    current_context: 'context1',
    user: userMap
  };
  const expectedUserContext: UserContext = {
    user: decodeUser(userMap['user1'].user),
    identity: decodeIdentity(userMap['user1'].identity),
    access_token: userMap['user1'].access_token
  };

  const argv = ({
    globalConfig: fixture,
    appConfig: {}
  } as any) as Arguments;

  const context = currentCLIContext(argv);
  expect(clusterConfigMap['server1']).toEqual(context.cluster);
  expect(context.user).toMatchObject(expectedUserContext);
});

test('currentCLIContext with context2', async () => {
  const fixture: GlobalConfig = {
    cluster: clusterConfigMap,
    context: contextMap,
    current_context: 'context2',
    user: userMap
  };
  const expectedUserContext: UserContext = {
    user: decodeUser(userMap['user2'].user),
    identity: decodeIdentity(userMap['user2'].identity),
    access_token: userMap['user2'].access_token
  };

  const argv = ({
    globalConfig: fixture,
    appConfig: {}
  } as any) as Arguments;

  const context = currentCLIContext(argv);
  expect(clusterConfigMap['server2']).toEqual(context.cluster);
  expect(context.user).toMatchObject(expectedUserContext);
});

test('currentCLIContext with unknown context', async () => {
  const fixture: GlobalConfig = {
    cluster: clusterConfigMap,
    context: contextMap,
    current_context: 'unknown_context',
    user: userMap
  };

  const argv = ({
    globalConfig: fixture,
    appConfig: {}
  } as any) as Arguments;

  const context = currentCLIContext(argv);
  expect(context.cluster).not.toEqual(expect.anything());
  expect(context.user).not.toEqual(expect.anything());
});
