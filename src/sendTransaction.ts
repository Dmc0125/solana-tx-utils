import { Connection, SendOptions, VersionedTransaction } from '@solana/web3.js'

import {
	confirmTransaction,
	TxSuccessResponse,
	TxErrorResponse,
	TxUnconfirmedResponse,
} from './confirmTransaction.js'

export const DEFAULT_SEND_OPTIONS: SendOptions = {
	maxRetries: 20,
	skipPreflight: true,
}

export type SendTransactionParams = {
	transaction: VersionedTransaction
	lastValidBlockHeight: number
	connection: Connection
}

export type SendTransactionConfig = {
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
export type SendTransactionResponse = {
	txId: string
} & (TxSuccessResponse | TxErrorResponse | TxUnconfirmedResponse)

// TODO: separate function for send tx and sendAndConfirm tx
/**
 * Sends, confirms and parses transaction
 *
 * @returns Transaction id, status, data (tx metadata) and error
 *   - `status = SUCCESS` - Tx was executed successfully
 *   - `status = ERROR` - Tx failed with some error
 *   - `status = TIMEOUT` - Tx was not confirmed in specified time, can be sent again without changes
 *   - `status = BLOCK_HEIGHT_EXCEEDED` - Tx was not confirmed and can not be confirmed anymore without updating block hash and block height
 */
export const sendTransaction = async (
	{ transaction, lastValidBlockHeight, connection }: SendTransactionParams,
	config?: SendTransactionConfig,
): Promise<SendTransactionResponse> => {
	const rawTx = transaction.serialize()
	const txId = await connection.sendRawTransaction(
		rawTx,
		config?.sendOptions || DEFAULT_SEND_OPTIONS,
	)
	if (config?.log) {
		console.log(`[solana-tx-utils]: Sending tx with id: ${txId}`)
	}

	const response = await confirmTransaction({
		txId,
		lastValidBlockHeight,
		connection,
		log: config?.log,
		maxConfirmationTime: config?.maxConfirmationTime,
	})

	return {
		...response,
		txId,
	}
}
