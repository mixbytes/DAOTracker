import { Abi } from 'eosjs/dist/eosjs-rpc-interfaces';

export const SPONSORSHIP_EXT: Abi = {
  version: "eosio::abi/1.0",
  tables: [],
  types: [],
  error_messages: [],
  actions: [],
  abi_extensions: [],
  ricardian_clauses: [],
  structs: [
    {
      name: "sponsor_ext",
      base: "",
      fields: [
        {
          name: "sponsor",
          type: "name"
        },
      ]
    }
  ],
};

export const GAME_STARTED: Abi = {
  "version": "eosio::abi/1.1",
  "structs": [
    {
      "name": "event_data",
      "base": "",
      "fields": []
    }
  ],
  "types": [],
  "actions": [],
  "tables": [],
  "ricardian_clauses": [],
  "variants": [],
  error_messages: [],
  abi_extensions: [],
}
export const GAME_FAILED: Abi = {
  "version": "eosio::abi/1.1",
  "structs": [
    {
      "name": "event_data",
      "base": "",
      "fields": [
        {
          "name": "player_win_amount",
          "type": "asset"
        },
        {
          "name": "msg",
          "type": "bytes"
        }
      ]
    }
  ],
  "types": [],
  "actions": [],
  "tables": [],
  "ricardian_clauses": [],
  "variants": [],
  error_messages: [],
  abi_extensions: [],
}
export const GAME_MESSAGE: Abi = {
  "version": "eosio::abi/1.1",
  "structs": [
    {
      "name": "event_data",
      "base": "",
      "fields": [
        {
          "name": "msg",
          "type": "bytes"
        }
      ]
    }
  ],
  "types": [],
  "actions": [],
  "tables": [],
  "ricardian_clauses": [],
  "variants": [],
  error_messages: [],
  abi_extensions: [],
}
export const GAME_FINISHED: Abi = {
  "version": "eosio::abi/1.1",
  "structs": [
    {
      "name": "event_data",
      "base": "",
      "fields": [
        {
          "name": "player_win_amount",
          "type": "asset"
        },
        {
          "name": "msg",
          "type": "bytes"
        }
      ]
    }
  ],
  "types": [],
  "actions": [],
  "tables": [],
  "ricardian_clauses": [],
  "variants": [],
  error_messages: [],
  abi_extensions: [],
}

export const extensions = {
  0: SPONSORSHIP_EXT
}
