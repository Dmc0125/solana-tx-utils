import { Connection, Keypair } from '@solana/web3.js'
import dotenv from 'dotenv'

dotenv.config()

const TEST_RPC_PORT = process.env.RPC_URL_PORT || '8899'
const TEST_RPC_URL = `http://localhost:${TEST_RPC_PORT}`

export const wallet = new Keypair()

export const connection = new Connection(TEST_RPC_URL)

const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
const txId = await connection.requestAirdrop(wallet.publicKey, 500 * 10 ** 9)
await connection.confirmTransaction(
	{
		signature: txId,
		blockhash,
		lastValidBlockHeight,
	},
	'finalized',
)
