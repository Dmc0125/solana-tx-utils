import { Connection, SignatureResult } from '@solana/web3.js'
import { setTimeout } from 'node:timers/promises'

import {
	ConfirmedTransactionResponse,
	getTransaction,
	GetTransactionCommitment,
} from '../utils/getTransaction.js'
import { parseTransactionError } from '../utils/parseTransaction.js'
import { wait } from '../utils/wait.js'
import { TxErrorResponse, TxSuccessResponse, TxUnconfirmedResponse } from './types.js'

const parseTransactionResponse = (tx: ConfirmedTransactionResponse, log?: boolean) => {
	if (tx?.meta?.err) {
		const parsedError = parseTransactionError(tx, tx.meta.err)
		if (log) {
			console.log('[solana-tx-utils]: Tx Error:', parsedError)
		}
		return {
			data: null,
			error: parsedError,
			status: 'ERROR',
		} as TxErrorResponse
	} else {
		if (log) {
			console.log(`[solana-tx-utils]: Tx Success`)
		}
		return {
			data: tx.meta,
			error: null,
			status: 'SUCCESS',
		} as TxSuccessResponse
	}
}

type WatchTxConfirmationParams = {
	startTime: number
	txId: string
	abortSignal: AbortSignal
	connection: Connection
	maxConfirmationTime: number
	log?: boolean
	commitment: GetTransactionCommitment
}

export const watchTxConfirmationPolling = async ({
	startTime,
	txId,
	abortSignal,
	connection,
	maxConfirmationTime,
	log,
	commitment,
}: WatchTxConfirmationParams): Promise<
	TxSuccessResponse | TxErrorResponse | TxUnconfirmedResponse
> => {
	while (new Date().getTime() - startTime < maxConfirmationTime && !abortSignal.aborted) {
		const txRes = await Promise.any([
			getTransaction(txId, connection.rpcEndpoint, commitment),
			wait(5000),
		])
		if (txRes) {
			return parseTransactionResponse(txRes, log)
		}
		await wait(1000)
	}

	return {
		data: null,
		error: null,
		status: 'TIMEOUT',
	}
}

export const watchTxConfirmationWebsocket = async ({
	startTime,
	txId,
	abortSignal,
	connection,
	maxConfirmationTime,
	log,
	commitment,
}: WatchTxConfirmationParams): Promise<
	TxSuccessResponse | TxErrorResponse | TxUnconfirmedResponse
> => {
	let sigResult: SignatureResult | null = null
	const subId = connection.onSignature(
		txId,
		(_data) => {
			sigResult = _data
		},
		'confirmed',
	)

	// Fetch once in case tx was confirmed before websocket connection was established
	const startTxRes = await Promise.any([
		getTransaction(txId, connection.rpcEndpoint, commitment),
		wait(5000),
	])
	if (startTxRes) {
		return parseTransactionResponse(startTxRes, log)
	}

	while (
		new Date().getTime() - startTime < maxConfirmationTime &&
		!sigResult &&
		!abortSignal.aborted
	) {
		await setTimeout(1000)
	}

	if (!sigResult || abortSignal.aborted) {
		connection.removeSignatureListener(subId)
		return {
			status: 'TIMEOUT',
			data: null,
			error: null,
		}
	}

	// If we are fetching transaction, it's because it was already processes, confirmed by websocket
	// we can assume it's always defined
	const txRes = await getTransaction(txId, connection.rpcEndpoint, commitment)
	return parseTransactionResponse(txRes!, log)
}
