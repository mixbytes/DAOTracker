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

export const extensions = {
  0: SPONSORSHIP_EXT
}
