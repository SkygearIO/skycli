/* eslint-disable */
import fetch from 'node-fetch';
import FormData from 'form-data';

export function upload(uploadRequest, file) {
  const { url, fields } = uploadRequest;
  const fileName = fields.key.split('/').splice(-1)[0];
  const data =
    Object.keys(fields)
    .map((eachFieldKey) => ({
      key: eachFieldKey,
      value: fields[eachFieldKey]
    }))
    .reduce((d, { key, value }) => {
      d.append(key, value);
      return d;
    }, new FormData());

  data.append('file', file);

  return fetch(url, {
    method: 'POST',
    body: data
  }).then((resp) => {
    if (resp.status >= 400) {
      throw new Error('Failed to upload asset');
    }
    return resp;
  });
}

export function download(url) {
  return fetch(url, {
    method: 'GET',
    headers: {
      pragma: 'no-cache',
      'Cache-Control': 'no-cache'
    }
  }).then((resp) => {
    if (resp.status !== 200) {
      throw new Error('Failed to download asset');
    }
    return resp.text();
  });
}
/* eslint-enable */
