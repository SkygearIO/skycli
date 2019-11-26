import { diff, DiffResult } from "./updateTemplates";
import { LocalTemplateItem, RemoteTemplateItem } from "../../container/types";

interface Case {
  remote: RemoteTemplateItem[];
  local: LocalTemplateItem[];
  result: DiffResult;
}

test("diff", () => {
  const cases: Case[] = [
    // empty input
    {
      remote: [],
      local: [],
      result: {
        added: [],
        removed: [],
        updated: [],
        unchanged: [],
      },
    },

    // add and remove
    {
      remote: [
        {
          type: "a",
          uri: "asset-gear:///a",
          content_md5: "a",
          signed_uri: "http://example.com/a",
        },
      ],
      local: [
        {
          type: "b",
          content_md5: "b",
          filePath: "b",
        },
      ],
      result: {
        added: [
          {
            type: "b",
            content_md5: "b",
            filePath: "b",
          },
        ],
        removed: [
          {
            type: "a",
            uri: "asset-gear:///a",
            content_md5: "a",
            signed_uri: "http://example.com/a",
          },
        ],
        updated: [],
        unchanged: [],
      },
    },

    // update and unchanged
    {
      remote: [
        {
          type: "a",
          uri: "asset-gear:///a",
          content_md5: "a",
          signed_uri: "http://example.com/a",
        },
        {
          type: "b",
          uri: "asset-gear:///b",
          content_md5: "b",
          signed_uri: "http://example.com/b",
        },
      ],
      local: [
        {
          type: "a",
          content_md5: "a",
          filePath: "a",
        },
        {
          type: "b",
          content_md5: "bb",
          filePath: "b",
        },
      ],
      result: {
        added: [],
        removed: [],
        updated: [
          {
            type: "b",
            content_md5: "bb",
            filePath: "b",
          },
        ],
        unchanged: [
          {
            type: "a",
            uri: "asset-gear:///a",
            content_md5: "a",
            signed_uri: "http://example.com/a",
          },
        ],
      },
    },
  ];

  for (const c of cases) {
    expect(diff(c.remote, c.local)).toEqual(c.result);
  }
});
