import {
	AddressLookupTableAccount,
	Connection,
	MessageV0,
	PublicKey,
	Signer,
	TransactionInstruction,
	TransactionMessage,
	VersionedTransaction,
} from '@solana/web3.js'

import { assert } from './utils/assert.js'
import { wait } from './utils/wait.js'

const fetchBlockHash = async (
	connection: Connection,
): Promise<
	Readonly<{
		blockhash: string
		lastValidBlockHeight: number
	}>
> => {
	try {
		const res = await connection.getLatestBlockhash()
		return res
	} catch (error) {
		await wait(500)
		return fetchBlockHash(connection)
	}
}

export type BuildTransactionParams = {
	instructions: TransactionInstruction[]
	addressLookupTables?: AddressLookupTableAccount[]
	payerKey: PublicKey
}

/**
 * Fetches block hash and builds unsigned V0 transaction
 */
export const buildTransaction = async (
	{ instructions, addressLookupTables, payerKey }: BuildTransactionParams,
	connection: Connection,
) => {
	const { blockhash, lastValidBlockHeight } = await fetchBlockHash(connection)

	const txMessage = new TransactionMessage({
		instructions,
		payerKey,
		recentBlockhash: blockhash,
	}).compileToV0Message(addressLookupTables)

	return {
		transaction: new VersionedTransaction(txMessage),
		lastValidBlockHeight,
	}
}

export type BuiltTransactionData = {
	transaction: VersionedTransaction
	lastValidBlockHeight: number
}

export type BuildAndSignTxFromInstructionsParams = Omit<BuildTransactionParams, 'payerKey'> & {
	signers: Signer[]
	payerKey?: PublicKey
}

/**
 * If payer is not defined, first signer is used as payer
 *  - At least one signer needs to be provided, otherwise throws an Error
 *
 * @returns BuildTransactionData
 *  - `transaction` - Compiled V0 transaction object
 *  - `lastValidBlockHeight` - Used for client side validation if transaction can still be confirmed
 */
export const buildAndSignTxFromInstructions = async (
	{ payerKey, signers, instructions, addressLookupTables }: BuildAndSignTxFromInstructionsParams,
	connection: Connection,
): Promise<BuiltTransactionData> => {
	assert(signers.length > 0, new Error('At least one signer has to be provided'))

	const _payerKey = payerKey || signers[0].publicKey

	const txData = await buildTransaction(
		{
			instructions,
			addressLookupTables,
			payerKey: _payerKey,
		},
		connection,
	)
	txData.transaction.sign(signers)

	return txData
}

export type BuildAndSignTxFromMessageV0Params = {
	message: MessageV0
	signers: Signer[]
}

/**
 * At least one signer needs to be provided, otherwise throws an Error
 *
 * @returns BuildTransactionData
 *  - `transaction` - Compiled V0 transaction object
 *  - `lastValidBlockHeight` - Used for client side validation if transaction can still be confirmed
 */
export const buildAndSignTxFromMessageV0 = async (
	{ message, signers }: BuildAndSignTxFromMessageV0Params,
	connection: Connection,
) => {
	assert(signers.length > 0, new Error('At least one signer has to be provided'))

	const { blockhash, lastValidBlockHeight } = await fetchBlockHash(connection)

	const tx = new VersionedTransaction(message)
	tx.message.recentBlockhash = blockhash
	tx.sign(signers)

	return {
		transaction: tx,
		lastValidBlockHeight,
	}
}
