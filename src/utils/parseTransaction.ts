import { PublicKey, TransactionError } from '@solana/web3.js'

import { ConfirmedTransactionResponse } from './getTransaction.js'

type InstructionError = [number, { Custom: number } | string]

type TransactionInstructionError = {
	InstructionError?: InstructionError
}

export type ParsedTransactionError = {
	programId: PublicKey | null
	error: number | string | null
}

export const parseTransactionError = (
	txResponse: ConfirmedTransactionResponse,
	txError: TransactionError,
): ParsedTransactionError => {
	const _error = txError as TransactionInstructionError
	if ('InstructionError' in _error && _error.InstructionError) {
		const [instructionIndex, error] = _error.InstructionError

		const { accountKeys, instructions } = txResponse.transaction.message
		const instruction = instructions[instructionIndex]
		const programId = accountKeys[instruction.programIdIndex]

		return {
			programId: new PublicKey(programId),
			error: typeof error === 'string' ? error : error.Custom,
		}
	}

	console.error(`[solana-tx-utils]: Could not parse transaction error: ${txError}`)
	return {
		programId: null,
		error: null,
	}
}
