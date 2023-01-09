import { ConfirmedTransactionMeta, Connection } from '@solana/web3.js'

import { getTransaction } from './utils/getTransaction.js'
import { ParsedTransactionError, parseTransactionError } from './utils/parseTransaction.js'
import { wait } from './utils/wait.js'

export const DEFAULT_MAX_CONFIRMATION_TIME = 120_000

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
	log?: boolean,
): Promise<TxSuccessResponse | TxErrorResponse | TxUnconfirmedResponse> => {
	while (new Date().getTime() - startTime < maxConfirmationTime && !abortSignal.aborted) {
		const tx = await Promise.any([getTransaction(txId, connection.rpcEndpoint), wait(5000)])

		if (tx?.meta?.err) {
			const parsedError = parseTransactionError(tx, tx.meta.err)
			if (log) {
				console.log('[solana-tx-utils]: Tx Error:', parsedError)
			}
			return {
				data: null,
				error: parsedError,
				status: 'ERROR',
			}
		}

		if (tx?.meta) {
			if (log) {
				console.log(`[solana-tx-utils]: Tx Success`)
			}
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
	lastValidBlockHeight: number,
	abortSignal: AbortSignal,
	connection: Connection,
	maxConfirmationTime: number,
): Promise<TxUnconfirmedResponse> => {
	while (new Date().getTime() - startTime < maxConfirmationTime && !abortSignal.aborted) {
		let blockHeight = -1
		try {
			blockHeight = await connection.getBlockHeight(connection.commitment)
		} catch (err) {}

		if (blockHeight > lastValidBlockHeight) {
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

export type ConfirmTransactionParams = {
	txId: string
	connection: Connection
	lastValidBlockHeight: number
	log?: boolean
	maxConfirmationTime?: number
}

/**
 * Confirms transaction and parses the transaction meta.
 * Transaction confirmation happens based on:
 *  - *Block height* - comparison of `current block height` and `last valid block height` for transaction
 *  - *Time* - checking if the tx is confirmed in allowed time window
 *
 * @returns Transaction status, data (tx metadata) and error
 *   - `status = SUCCESS` - Tx was executed successfully
 *   - `status = ERROR` - Tx failed with some error
 *   - `status = TIMEOUT` - Tx was not confirmed in specified time, can be sent again without changes
 *   - `status = BLOCK_HEIGHT_EXCEEDED` - Tx was not confirmed and can not be confirmed anymore without updating block hash and block height
 */
export const confirmTransaction = async ({
	txId,
	connection,
	lastValidBlockHeight,
	log,
	maxConfirmationTime,
}: ConfirmTransactionParams) => {
	const startTime = new Date().getTime()
	const _maxConfTime = maxConfirmationTime || DEFAULT_MAX_CONFIRMATION_TIME

	const abortController = new AbortController()
	const response = await Promise.any([
		watchTxConfirmation(startTime, txId, abortController.signal, connection, _maxConfTime, log),
		watchBlockHeight(
			startTime,
			lastValidBlockHeight,
			abortController.signal,
			connection,
			_maxConfTime,
		),
	])
	abortController.abort()

	return response
}
