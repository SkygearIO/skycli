/* eslint-disable */
import fetch from 'node-fetch';

import { handleFailureResponse } from './error';

export let config = {};

function defaultHeaders(token) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  if (token) {
    // The Controller requires that the authorization header to use
    // different authorization scheme for different types of tokens.
    // If the token is a JSON Web Token, the scheme should be `JWT` instead
    // of `Token`.
    //
    // According to the spec, the first part of the JWT is a base64 encoded
    // string of JSON. Practically JWT always begins with `eyJ`.
    //
    // If the string does not start with `eyJ`, assume it is other
    // authentication token, hence use the `Token` scheme.
    if (token.indexOf('eyJ') === 0) {
      headers.Authorization = `JWT ${token}`;
    } else {
      headers.Authorization = `Token ${token}`;
    }
  }
  return headers;
}

export function login(email, password) {
  return fetch(config.url + 'auth/login/', {
    method: 'POST',
    headers: {
      ...defaultHeaders()
    },
    body: JSON.stringify({
      username: email,
      password: password
    })
  }).then((response) => {
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function signup(name, companyName, email, password, appName, refCode) {
  return fetch(config.url + 'auth/register/', {
    method: 'POST',
    headers: {
      ...defaultHeaders()
    },
    body: JSON.stringify({
      name: name,
      company_name: companyName,
      username: email,
      app_name: appName,
      email: email,
      password: password,
      ref_code: refCode
    })
  }).then((response) => {
    if (response.status === 201) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function passwd(password, newPassword, token) {
  return fetch(config.url + 'auth/passwd/', {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      password: password,
      new_password: newPassword
    })
  }).then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function keys(token) {
  return fetch(config.url + 'keys/', {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    return response.json();
  }).then((data) => {
    // The format is:
    // {
    //     "count": 1,
    //     "next": null,
    //     "previous": null,
    //     "results": [{
    //       "created": "2016-05-05T02:19:04UTC",
    //       "fingerprint": "75:19:7c:dd:c8:68:75:d0:c0:92:80:80:b2:bd:6c:75",
    //       "id": "rick.mak@gmail.com",
    //       "owner": "rickmak@oursky.com",
    //       "public": "...",
    //       "updated": "2016-05-05T02:19:04UTC",
    //       "uuid": "4e92a230-0ac8-4dfd-94ef-585a2c7c53bd"
    //     }]
    // }
    return data.results;
  });
}

export function addKey(name, key, token) {
  return fetch(config.url + 'keys/', {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      id: name,
      public: key
    })
  }).then((response) => {
    if (response.status === 201) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function delKey(name, token) {
  const encodedName = encodeURIComponent(name);
  return fetch(config.url + `keys/${encodedName}`, {
    method: 'DELETE',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status === 204) {
      return true;
    } else {
      throw response.statusText;
    }
  });
}

export function appExist(appID) {
  const _id = encodeURIComponent(appID);
  return fetch(config.url + `apps/${_id}/exist`, {
    method: 'GET',
    headers: {
      ...defaultHeaders()
    }
  }).then((response) => {
    if (response.status === 200) {
      return true;
    } else if (response.status === 404) {
      return false;
    }
    throw 'Server error';
  });
}

export function apps(token) {
  return fetch(config.url + 'apps/', {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  }).then((data) => {
    // The format is {"count":0,"next":null,"previous":null,"results":[]}
    return data.results;
  });
}

export function app(appName, token) {
  return fetch(config.url + `apps/${appName}`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    // The format is
    // {
    //   "uuid": "",
    //   "id": "rick",
    //   "owner": "user@skygear.io",
    //   "structure": {"cmd": 1},
    //   "created": "2016-05-04T08:46:55UTC",
    //   "updated": "2016-05-06T10:04:14UTC",
    //   "plan": null,
    //   "last_build": {
    //     "sha": "a2e4e53",
    //     "version: "0.24.0",
    //     "skygear_version": "v0.17.0",
    //     "py_skygear_version": "v0.17.1"
    //   }
    // }
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function appConfig(appName, token) {
  return fetch(config.url + `apps/${appName}/config`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  }).then((data) => {
    // The format is {"values":{"key":"value"}, "plugins": {"name": true}}
    return {
      env: data.values,
      plugins: data.plugins
    };
  });
}

export function appStatus(appName, token) {
  return fetch(config.url + `apps/${appName}/status`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  }).then(({status, last_build_job: lastBuildJobStatus}) => {
    return {
      status,
      lastBuildJobStatus
    };
  });
}

export function updateAppConfig(appName, newAppConfig, token) {
  // Controller don't provide delete method. For unset, use {"key":null}
  return fetch(config.url + `apps/${appName}/config`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify(newAppConfig)
  }).then((response) => {
    if (response.status === 201) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function updateAppConfigValues(appName, values, token) {
  const newAppConfig = {
    values
  };
  return updateAppConfig(appName, newAppConfig, token);
}

export function updateAppPluginState(appName, newState, token) {
  return fetch(config.url + `apps/${appName}/config`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      plugins: newState
    })
  }).then((response) => {
    if (response.status === 201) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function scaleApp(appName, scale, token) {
  // The process is hardcode as "cmd"
  return fetch(config.url + `apps/${appName}/scale`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      cmd: scale
    })
  }).then((response) => {
    if (response.status === 204) {
      return true;
    } else {
      throw 'Unknow error';
    }
  });
}

export function appActivity(appName, token) {
  return fetch(config.url + `apps/${appName}/releases`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  }).then((data) => {
    // The format is {"count":0,"next":null,"previous":null,"results":[]}
    return data.results;
  });
}

export function appLog(appName, token) {
  return fetch(config.url + `apps/${appName}/logs`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function appLogStream(appName, token) {
  return fetch(config.url + `apps/${appName}/log-stream`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    /* The format is:
     *   {
     *     "websocket_url": "wss://piper.skygeario.com/...",
     *     "token": "..."
     *   }
     */
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function appCreate(name, token) {
  return fetch(config.url + 'apps/', {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      id: name
    })
  }).then((response) => {
    if (response.status === 201) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function services(appName, token) {
  if (appName === null) {
    throw 'Please provide name';
  }
  return fetch(config.url + `apps/${appName}/addons`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  }).then((data) => {
    return data.results;
  });
}

export function serviceCreate(appName, service, token) {
  // echo '{"service": "postgres"}' | \
  // http POST localhost:8000/v2/apps/peachy-occupant/addons \
  // Authorization: "JWT {}"
  if (appName === null) {
    throw 'Please provide name';
  }
  return fetch(config.url + `apps/${appName}/addons`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      service: service
    })
  }).then((response) => {
    if (response.status === 201) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function configApp(appName, postgres, jwt, token) {
  // {
  //  "values":{
  //    "DATABASE_URL":"postgresql://localhost:5432/rick4"
  //  }
  // }
  // http POST /v2/apps/tender-greenery/config/

  if (appName === null || postgres === null) {
    throw 'Please provide correct config';
  }
  return fetch(config.url + `apps/${appName}/config/`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      values: {
        DATABASE_URL: postgres.endpoint,
        TOKEN_STORE: 'jwt',
        TOKEN_STORE_SECRET: jwt.secret
      }
    })
  }).then((response) => {
    console.debug(response);
    if (response.status === 201) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function permission(appName, token) {
  if (appName === null) {
    throw 'Please provide name';
  }
  return fetch(config.url + `apps/${appName}/perms`, {
    method: 'GET',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status < 500) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
  // The format is
  // {
  //   "users": ["rickmak@oursky.com"],
  //   "invited_emails": ["foo@bar.com"]
  // }
}

export function addPermission(appName, email, token) {
  // {"username":"rickmak@oursky.com"}
  // http post /v2/apps/tender-greenery/perms
  if (appName === null || email === null) {
    throw 'Please provide correct config';
  }
  return fetch(config.url + `apps/${appName}/perms/`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({
      username: email
    })
  }).then((response) => {
    console.debug(response);
    if (response.status === 201) {
      // Added permission
      return {
        type: 'ADDED',
        email
      };
    } else if (response.status === 202) {
      // Accepted, inviting user
      return {
        type: 'INVITED',
        email
      };
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function removePermission(appName, email, token) {
  // DELETE /v2/apps/rick/perms/rickmak@oursky.com/ HTTP/1.1
  const encodedName = encodeURIComponent(email);
  return fetch(config.url + `apps/${appName}/perms/${encodedName}/`, {
    method: 'DELETE',
    headers: {
      ...defaultHeaders(token)
    }
  }).then((response) => {
    if (response.status === 204) {
      return true;
    } else {
      throw response.statusText;
    }
  });
}

export function getInvitation(invitationCode) {
  return fetch(config.url + `invitations/${invitationCode}`, {
    method: 'GET',
    headers: {
      ...defaultHeaders()
    }
  })
  .then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function acceptInvitation(invitationCode, token) {
  return fetch(config.url + `invitations/${invitationCode}`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    }
  })
  .then((response) => {
    if (response.status === 204) {
      return true;
    } else {
      throw response.statusText;
    }
  });
}

export function connectDataBrowser(sessionID, databaseUrl) {
  const data = new FormData();
  data.append('url', databaseUrl);
  return fetch(config.dataBrowserEndpoint + '/connect', {
    method: 'POST',
    body: data,
    headers: {
      Accept: 'application/json',
      'x-session-id': sessionID
    }
  }).then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function getAssetUploadRequest(path, appName, token) {
  return fetch(config.url + `apps/${appName}/upload-asset`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({ path })
  })
  .then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}

export function createBuildJob(semver, appName, token) {
  return fetch(config.url + `apps/${appName}/build_jobs`, {
    method: 'POST',
    headers: {
      ...defaultHeaders(token)
    },
    body: JSON.stringify({ semver })
  })
  .then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return handleFailureResponse(response);
    }
  });
}
/* eslint-enable */
