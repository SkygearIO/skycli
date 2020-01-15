import { safeLoad } from "js-yaml";
import {
  migrateSkycliConfig,
  updateUser,
  getUser,
  deleteUser,
  createSkycliConfig,
} from "./config";

const fixture = `
cluster:
  default:
    endpoint: 'http://controller.skygear.localhost:8081'
    api_key: api_key
    env: enterprise
context:
  default:
    cluster: default
    user: default
current_context: default
user:
  default:
    user:
      id: user_id
      created_at: '2019-12-06T08:53:10.413Z'
      last_login_at: '2020-01-09T06:51:55.549Z'
      is_verified: true
      is_disabled: false
      metadata: {}
    identity:
      id: identity_id
      type: password
      login_id_key: email
      login_id: user@example.com
      claims:
        email: user@example.com
    access_token: access_token
    refresh_token: refresh_token
    session_id: session_id
`;

const expected = `
api_version: v1
clusters:
  - name: default
    cluster:
      endpoint: 'http://controller.skygear.localhost:8081'
      api_key: api_key
      env: enterprise
users:
  - name: default
    user:
      user:
        id: user_id
        created_at: '2019-12-06T08:53:10.413Z'
        last_login_at: '2020-01-09T06:51:55.549Z'
        is_verified: true
        is_disabled: false
        metadata: {}
      identity:
        id: identity_id
        type: password
        login_id_key: email
        login_id: user@example.com
        claims:
          email: user@example.com
      access_token: access_token
      refresh_token: refresh_token
      session_id: session_id
contexts:
  - name: default
    context:
      cluster: default
      user: default
current_context: default
`;

describe("migrateSkycliConfig", () => {
  it("migrate a typical config", () => {
    const oldConfig = safeLoad(fixture);
    const migrated = migrateSkycliConfig(oldConfig);
    const skycliConfig = safeLoad(expected);
    expect(skycliConfig).toEqual(migrated);
  });

  it("does nothing when migration is not needed", () => {
    const skycliConfig = safeLoad(expected);
    const migrated = migrateSkycliConfig(skycliConfig);
    expect(skycliConfig).toBe(migrated);
  });

  it("migrate a nullish config", () => {
    const oldConfig = safeLoad("{}");
    const migrated = migrateSkycliConfig(oldConfig);
    expect(migrated).toEqual({
      api_version: "v1",
    });
  });
});

describe("updateUser, getUser, deleteUser", () => {
  let c = createSkycliConfig();
  c = updateUser(c, "default", u => {
    return {
      ...u,
      access_token: "access_token",
    };
  });

  expect(c).toEqual({
    api_version: "v1",
    users: [{ name: "default", user: { access_token: "access_token" } }],
  });

  expect(getUser(c, "default")).toEqual({ access_token: "access_token" });

  expect(deleteUser(c, "default")).toEqual({
    api_version: "v1",
    users: [],
  });

  expect(
    updateUser(c, "default", u => {
      return {
        ...u,
        access_token: "new_token",
      };
    })
  ).toEqual({
    api_version: "v1",
    users: [{ name: "default", user: { access_token: "new_token" } }],
  });

  expect(deleteUser(c, "non-exist")).toEqual(c);

  expect(getUser(c, "non-exist")).toBeFalsy();
});
