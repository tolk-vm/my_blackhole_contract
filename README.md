# Example TON contract

A simple experiment with TON: a contract written in FunC, that stores `counter_value`, `recent_inc_addr` and 
some other stuff in a storage cell, with some getters (`method_id`) and some actions as opcode inside `recv_internal`.

Uses [blueprint](https://github.com/ton-org/blueprint) as a testing and deployment framework. 
Hence, `yarn blueprint run` to interactively execute any script inside `scripts/`.

Besides the contract and tests, there are some experiments to call getters and actions on an already 
deployed contract [to testnet](https://testnet.tonscan.org/address/EQD4Nu_attpQdAHKaSOKSUwAfpJUrXIstF5yGqZvYr-RJT6e).
Calling get methods (`method_id`) can be done via `TonClient` and `@orbs-network`.
Invoking actions requires authorization via a real wallet or mnemonic (24 words in `.env`) 
to pay for transactions on behalf of the user.

There are also experiments with a [web app front-end](https://github.com/unserialize/my_blackhole_frontend) 
to the same contract and [a Telegram bot](https://github.com/unserialize/my_blackhole_tg_bot).
