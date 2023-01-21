import { Connection } from '@solana/web3.js'

import { watchBlockHeight } from './confirm-transaction/blockHeightConfirmation.js'
import {
	watchTxConfirmationPolling,
	watchTxConfirmationWebsocket,
} from './confirm-transaction/transactionConfirmation.js'
import {
	ConfirmMethod,
	TxErrorResponse,
	TxSuccessResponse,
	TxUnconfirmedResponse,
} from './confirm-transaction/types.js'
import { GetTransactionCommitment } from './utils/getTransaction.js'

export const DEFAULT_MAX_CONFIRMATION_TIME = 120_000

export type ConfirmTransactionParams = {
	txId: string
	connection: Connection
	lastValidBlockHeight: number
	log?: boolean
	maxConfirmationTime?: number
	method?: ConfirmMethod
	commitment?: GetTransactionCommitment
}

/**
 * Confirms transaction and parses the transaction meta.
 *
 * Two methods can be used to confirm transaction
 * - *Polling* - Sending requests to RPC node
 * - *Websocket* - Listening for update from RPC node
 *
 * Transaction is confirmed based on:
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
	method = 'polling',
	commitment = 'confirmed',
}: ConfirmTransactionParams) => {
	const startTime = new Date().getTime()
	const _maxConfTime = maxConfirmationTime || DEFAULT_MAX_CONFIRMATION_TIME

	const abortController = new AbortController()

	let response: TxSuccessResponse | TxErrorResponse | TxUnconfirmedResponse

	if (method === 'polling') {
		response = await Promise.any([
			watchTxConfirmationPolling({
				maxConfirmationTime: _maxConfTime,
				abortSignal: abortController.signal,
				startTime,
				connection,
				commitment,
				txId,
				log,
			}),
			watchBlockHeight(
				startTime,
				lastValidBlockHeight,
				abortController.signal,
				connection,
				_maxConfTime,
			),
		])
	} else {
		response = await Promise.any([
			watchTxConfirmationWebsocket({
				maxConfirmationTime: _maxConfTime,
				abortSignal: abortController.signal,
				startTime,
				connection,
				commitment,
				txId,
				log,
			}),
			watchBlockHeight(
				startTime,
				lastValidBlockHeight,
				abortController.signal,
				connection,
				_maxConfTime,
			),
		])
	}

	abortController.abort()

	return response
}
