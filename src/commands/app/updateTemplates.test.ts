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
          digest: "a",
          signed_uri: "http://example.com/a",
        },
      ],
      local: [
        {
          type: "b",
          digest: "b",
          filePath: "b",
        },
      ],
      result: {
        added: [
          {
            type: "b",
            digest: "b",
            filePath: "b",
          },
        ],
        removed: [
          {
            type: "a",
            uri: "asset-gear:///a",
            digest: "a",
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
          digest: "a",
          signed_uri: "http://example.com/a",
        },
        {
          type: "b",
          uri: "asset-gear:///b",
          digest: "b",
          signed_uri: "http://example.com/b",
        },
      ],
      local: [
        {
          type: "a",
          digest: "a",
          filePath: "a",
        },
        {
          type: "b",
          digest: "bb",
          filePath: "b",
        },
      ],
      result: {
        added: [],
        removed: [],
        updated: [
          {
            type: "b",
            digest: "bb",
            filePath: "b",
          },
        ],
        unchanged: [
          {
            type: "a",
            uri: "asset-gear:///a",
            digest: "a",
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
