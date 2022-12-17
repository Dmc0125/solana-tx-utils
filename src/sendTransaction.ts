import { ConfirmedTransactionMeta, Connection } from '@solana/web3.js'

import { getTransaction } from './utils/getTransaction.js'
import { ParsedTransactionError, parseTransactionError } from './utils/parseTransaction.js'
import { VersionedTransactionWithLastValidBlockHeight } from './utils/VersionedTransactionWithLastValidBlockHeight.js'
import { wait } from './utils/wait.js'

const MAX_CONFIRMATION_TIME = 120_000

/**
 * - `status = SUCCESS` - Tx was executed successfully
 */
export type TxSuccessResponse = {
	status: 'SUCCESS'
	data: ConfirmedTransactionMeta
	error: null
}

/** - `status = ERROR` - Tx failed with some error */
export type TxErrorResponse = {
	status: 'ERROR'
	data: null
	error: ParsedTransactionError
}

/**
 * - `status = TIMEOUT` - Tx was not confirmed in specified time, can be sent again without changes
 * - `status = BLOCK_HEIGHT_EXCEEDED` - Tx was not confirmed and can not be confirmed anymore without updating block hash and block height
 */
export type TxUnconfirmedResponse = {
	status: 'TIMEOUT' | 'BLOCK_HEIGHT_EXCEEDED'
	data: null
	error: null
}

const watchTxConfirmation = async (
	startTime: number,
	txId: string,
	abortSignal: AbortSignal,
	connection: Connection,
	maxConfirmationTime: number,
): Promise<TxSuccessResponse | TxErrorResponse | TxUnconfirmedResponse> => {
	while (new Date().getTime() - startTime < maxConfirmationTime && !abortSignal.aborted) {
		const tx = await Promise.any([getTransaction(txId, connection.rpcEndpoint), wait(5000)])

		if (tx?.meta?.err) {
			return {
				data: null,
				error: parseTransactionError(tx, tx.meta.err),
				status: 'ERROR',
			}
		}

		if (tx?.meta) {
			return {
				data: tx.meta,
				error: null,
				status: 'SUCCESS',
			}
		}

		await wait(1000)
	}

	return {
		data: null,
		error: null,
		status: 'TIMEOUT',
	}
}

const watchBlockHeight = async (
	startTime: number,
	transaction: VersionedTransactionWithLastValidBlockHeight,
	abortSignal: AbortSignal,
	connection: Connection,
	maxConfirmationTime: number,
): Promise<TxUnconfirmedResponse> => {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const txValidUntilBlockHeight = transaction.lastValidBlockHeight!

	while (new Date().getTime() - startTime < maxConfirmationTime && !abortSignal.aborted) {
		let blockHeight = -1
		try {
			blockHeight = await connection.getBlockHeight(connection.commitment)
		} catch (err) {}

		if (blockHeight > txValidUntilBlockHeight) {
			return {
				status: 'BLOCK_HEIGHT_EXCEEDED',
				error: null,
				data: null,
			}
		}

		await wait(2000)
	}

	return {
		status: 'TIMEOUT',
		data: null,
		error: null,
	}
}

export type SendTransactionParams = {
	transaction: VersionedTransactionWithLastValidBlockHeight
	connection: Connection
	maxConfirmationTime?: number
}

/**
 * Sends, confirms and parses transaction
 *
 * @returns Transaction status, data and error
 *   - `status = SUCCESS` - Tx was executed successfully
 *   - `status = ERROR` - Tx failed with some error
 *   - `status = TIMEOUT` - Tx was not confirmed in specified time, can be sent again without changes
 *   - `status = BLOCK_HEIGHT_EXCEEDED` - Tx was not confirmed and can not be confirmed anymore without updating block hash and block height
 */
export const sendTransaction = async ({
	transaction,
	connection,
	maxConfirmationTime = MAX_CONFIRMATION_TIME,
}: SendTransactionParams) => {
	const rawTx = transaction.serialize()
	const txId = await connection.sendRawTransaction(rawTx, {
		maxRetries: 20,
		skipPreflight: true,
	})
	console.log(`[solana-tx-utils]: Sending tx with id: ${txId}`)
	const startTime = new Date().getTime()

	const abortController = new AbortController()
	const response = await Promise.any([
		watchTxConfirmation(startTime, txId, abortController.signal, connection, maxConfirmationTime),
		watchBlockHeight(
			startTime,
			transaction,
			abortController.signal,
			connection,
			maxConfirmationTime,
		),
	])
	abortController.abort()

	return response
}
