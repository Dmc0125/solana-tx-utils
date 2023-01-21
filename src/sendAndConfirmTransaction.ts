import { Connection, SendOptions, VersionedTransaction } from '@solana/web3.js'

import { confirmTransaction } from './confirmTransaction.js'
import {
	TxSuccessResponse,
	TxErrorResponse,
	TxUnconfirmedResponse,
} from './confirm-transaction/types.js'
import { sendTransaction } from './sendTransaction.js'
import { GetTransactionCommitment } from './utils/getTransaction.js'

export type SendAndConfirmTransactionParams = {
	transaction: VersionedTransaction
	lastValidBlockHeight: number
	connection: Connection
}

export type SendAndConfirmTransactionConfig = {
	method?: 'polling' | 'websocket'
	confirmationCommitment?: GetTransactionCommitment
	maxConfirmationTime?: number
	log?: boolean
	sendOptions?: SendOptions
}

/**
 * - `status = SUCCESS` - Tx was executed successfully
 * - `status = ERROR` - Tx failed with some error
 * - `status = TIMEOUT` - Tx was not confirmed in specified time, can be sent again without changes
 * - `status = BLOCK_HEIGHT_EXCEEDED` - Tx was not confirmed and can not be confirmed anymore without updating block hash and block height
 */
export type SendAndConfirmTransactionResponse = {
	txId: string
} & (TxSuccessResponse | TxErrorResponse | TxUnconfirmedResponse)

/**
 * Sends, confirms and parses transaction
 *
 * Two methods can be used to confirm transaction
 * - *Polling* - Sending requests to RPC node
 * - *Websocket* - Listening for update from RPC node
 *
 * Transaction is confirmed based on:
 *  - *Block height* - comparison of `current block height` and `last valid block height` for transaction
 *  - *Time* - checking if the tx is confirmed in allowed time window
 * 
 * @returns Transaction id, status, data (tx metadata) and error
 *   - `status = SUCCESS` - Tx was executed successfully
 *   - `status = ERROR` - Tx failed with some error
 *   - `status = TIMEOUT` - Tx was not confirmed in specified time, can be sent again without changes
 *   - `status = BLOCK_HEIGHT_EXCEEDED` - Tx was not confirmed and can not be confirmed anymore without updating block hash and block height
 */
export const sendAndConfirmTransaction = async (
	{ transaction, lastValidBlockHeight, connection }: SendAndConfirmTransactionParams,
	config?: SendAndConfirmTransactionConfig,
): Promise<SendAndConfirmTransactionResponse> => {
	const txId = await sendTransaction({
		transaction,
		connection,
		sendOptions: config?.sendOptions,
	})
	if (config?.log) {
		console.log(`[solana-tx-utils]: Sending tx with id: ${txId}`)
	}

	const response = await confirmTransaction({
		txId,
		lastValidBlockHeight,
		connection,
		log: config?.log,
		maxConfirmationTime: config?.maxConfirmationTime,
		method: config?.method,
		commitment: config?.confirmationCommitment,
	})

	return {
		...response,
		txId,
	}
}
