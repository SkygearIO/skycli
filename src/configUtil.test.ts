import { currentCLIContext } from "./configUtil";
import { SkycliConfig } from "./types";
import { SkygearYAML } from "./container/types";
import { Arguments } from "./util";

const fixture: SkycliConfig = {
  api_version: "v1",
  clusters: [
    {
      name: "server1",
      cluster: {
        env: "cloud",
        endpoint: "http://endpoint",
        api_key: "server1key",
      },
    },
    {
      name: "server2",
      cluster: {
        env: "enterprise",
        endpoint: "http://endpoint2",
        api_key: "server2key",
      },
    },
  ],
  users: [
    {
      name: "user1",
      user: {
        user: {
          id: "user_id1",
          created_at: "1970-01-01T00:00:00.000Z",
          last_login_at: "1970-01-01T00:00:00.000Z",
          is_verified: "false",
          is_disabled: "false",
          metadata: {},
        },
        identity: {
          id: "identityid1",
          type: "password",
          login_id: "email",
          login_id_key: "user1@skygear.io",
          realm: "default",
          claims: {},
        },
        access_token: "access_token",
      },
    },
    {
      name: "user2",
      user: {
        user: {
          id: "user_id2",
          created_at: "1970-01-01T00:00:00.000Z",
          last_login_at: "1970-01-01T00:00:00.000Z",
          is_verified: "false",
          is_disabled: "false",
          metadata: {},
        },
        identity: {
          id: "identityid2",
          type: "password",
          login_id: "email",
          login_id_key: "user2@skygear.io",
          realm: "default",
          claims: {},
        },
        access_token: "access_token2",
      },
    },
  ],
  contexts: [
    {
      name: "context1",
      context: {
        user: "user1",
        cluster: "server1",
      },
    },
    {
      name: "context2",
      context: {
        user: "user2",
        cluster: "server2",
      },
    },
    {
      name: "context3",
      context: {
        cluster: "server1",
      },
    },
    {
      name: "unknown_context",
      context: {
        user: "nonexistent",
        cluster: "nonexistent",
      },
    },
  ],
  current_context: null,
};

test("currentCLIContext with context1", async () => {
  const argv: Arguments = ({} as any) as Arguments;
  const config = {
    skycliConfig: {
      ...fixture,
      current_context: "context1",
    },
    skygearYAML: ({} as any) as SkygearYAML,
  };

  const context = currentCLIContext(argv, config);
  expect(context.cluster?.api_key).toEqual("server1key");
  expect(context.user?.user.id).toEqual("user_id1");
});

test("currentCLIContext with context2", async () => {
  const argv: Arguments = ({} as any) as Arguments;
  const config = {
    skycliConfig: {
      ...fixture,
      current_context: "context2",
    },
    skygearYAML: ({} as any) as SkygearYAML,
  };

  const context = currentCLIContext(argv, config);
  expect(context.cluster?.api_key).toEqual("server2key");
  expect(context.user?.user.id).toEqual("user_id2");
});

test("currentCLIContext with context3", async () => {
  const argv: Arguments = ({} as any) as Arguments;
  const config = {
    skycliConfig: {
      ...fixture,
      current_context: "context3",
    },
    skygearYAML: ({} as any) as SkygearYAML,
  };

  const context = currentCLIContext(argv, config);
  expect(context.cluster?.api_key).toEqual("server1key");
  expect(context.user).toBeFalsy();
});

test("currentCLIContext with unknown context", async () => {
  const argv: Arguments = ({} as any) as Arguments;
  const config = {
    skycliConfig: {
      ...fixture,
      current_context: "unknown_context",
    },
    skygearYAML: ({} as any) as SkygearYAML,
  };

  const context = currentCLIContext(argv, config);
  expect(context.cluster).toBeFalsy();
  expect(context.user).toBeFalsy();
});
