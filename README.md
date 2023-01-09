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
import { buildAndSignTxFromInstructions, sendTransaction } from 'solana-tx-utils'

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
const res = await sendTransaction({
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
import { confirmTransaction } from 'solana-tx-utils'

const res = confirmTransaction({
	txId: '...',
	connection,
	lastValidBlockHeight,
})

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
