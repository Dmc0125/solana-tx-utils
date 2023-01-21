import { Connection, SendOptions, VersionedTransaction } from '@solana/web3.js'

export const DEFAULT_SEND_OPTIONS: SendOptions = {
	maxRetries: 20,
	skipPreflight: true,
}

export type SendTransactionParams = {
	transaction: VersionedTransaction
	connection: Connection
	sendOptions?: SendOptions
}

/**
 * Sends transaction and returns signature (txId)
 */
export const sendTransaction = async ({
	transaction,
	connection,
	sendOptions,
}: SendTransactionParams) => {
	const _sendOptions = sendOptions || DEFAULT_SEND_OPTIONS
	const rawTx = transaction.serialize()
	const txId = await connection.sendRawTransaction(rawTx, _sendOptions)
	return txId
}
