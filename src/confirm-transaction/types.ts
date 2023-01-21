import { ConfirmedTransactionMeta } from '@solana/web3.js'

import { ParsedTransactionError } from '../utils/parseTransaction.js'

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

export type ConfirmMethod = 'polling' | 'websocket'
