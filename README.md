# Solana Transaction Utilities

Simple and small library with utilities for sending, building, singing, confirming and parsing Solana transactions

## Installation

```sh
npm i solana-tx-utils
```

- This library depends on @solana/web3.js

```sh
npm i @solana/web3.js
```

## Example usage

- Build transaction from instruction, send and confirm

```js
// Create connection, and wallet
import { Connection, SystemProgram } from '@solana/web3.js'
import { buildAndSignTxFromInstructions, sendAndConfirmTransaction } from 'solana-tx-utils'

const connection = new Connection('<RPC_URL>', options)
const wallet = new Keypair()

// Build and sign V0 transaction from instructions
const instructions = [
  SystemProgram.transfer({
    fromPubkey: ...,
    lamports: 5000,
    toPubkey: wallet.publicKey,
  }),
]
const addressLookupTables = [...]

const txData = await buildAndSignTxFromInstructions({
  signers: [wallet],
  instructions,
  addressLookupTables,
})

console.log(txData)
/*
{
  transaction: VersionedTransaction
  lastValidBlockHeight: number
}
*/

// Send and confirm signed transaction
const res = await sendAndConfirmTransaction({
  ...txData,
  connection,
})

console.log(res)
/*
If transaction was not confirmed
{
  txId: string
  status: 'TIMEOUT' | 'BLOCK_HEIGHT_EXCEEDED'
  data: null
  error: null
}
If transaction was confirmed and successfully sent
{
  txId: string
  status: 'SUCCESS'
  data: ConfirmedTransactionMeta
  error: null
}
If transaction was confirmed and resulted in error
{
  txId: string
  status: 'ERROR'
  data: null
  error: ParsedTransactionError
*/
```

- Confirm transaction based on txId

```js
import { confirmTransaction, sendTransaction } from 'solana-tx-utils'

const res = await sendAndConfirmTransaction({
	...txData,
	connection,
})

const res = confirmTransaction(
	{
		txId: '...',
		connection,
		lastValidBlockHeight,
	},
	{
		method: 'websocket', // It's possible to chose between websockets/polling for confirming transaction
	},
)

console.log(res)
/*
If transaction was not confirmed
{
  status: 'TIMEOUT' | 'BLOCK_HEIGHT_EXCEEDED'
  data: null
  error: null
}
If transaction was confirmed and successfully sent
{
  status: 'SUCCESS'
  data: ConfirmedTransactionMeta
  error: null
}
If transaction was confirmed and resulted in error
{
  status: 'ERROR'
  data: null
  error: ParsedTransactionError
*/
```

## Local development

- Install [Solana cli tools](https://docs.solana.com/cli/install-solana-cli-tools)

```sh
solana-keygen new
```

- If you are running test validator on port different from 8899
- Create .env file in /tests directory

```env
RPC_URL_PORT=<port>
```

</br>

- Run tests

```sh
pnpm validator
```

```sh
pnpm test
# or
pnpm test:w
```
