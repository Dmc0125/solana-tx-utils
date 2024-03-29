import { ConfirmedTransactionMeta, TransactionVersion, Commitment } from '@solana/web3.js'

export type AddressTableLookup = {
	accountKey: string
	readonlyIndexes: number[]
	writableIndexes: number[]
}

export type MessageHeader = {
	numReadonlySignedAccounts: number
	numReadonlyUnsignedAccounts: number
	numRequiredSignatures: number
}

export type Instruction = {
	accounts: number[]
	data: string
	programIdIndex: number
}

export type TransactionMessage = {
	accountKeys: string[]
	addressTableLookups: AddressTableLookup[]
	header: MessageHeader
	instructions: Instruction[]
	recentBlockhash: string
}

export type ConfirmedTransactionResponse = {
	slot: number
	transaction: {
		message: TransactionMessage
		signatures: string[]
	}
	meta: ConfirmedTransactionMeta | null
	blockTime?: number | null | undefined
	version?: TransactionVersion | undefined
}

type RPCRequestResponse<T> = {
	result: T
}

export type GetTransactionCommitment = Extract<Commitment, 'finalized' | 'confirmed'>

export const getTransaction = async (
	txId: string,
	rpcUrl: string,
	commitment: GetTransactionCommitment,
) => {
	try {
		const res = (await (
			await fetch(rpcUrl, {
				method: 'POST',
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'getTransaction',
					params: [
						txId,
						{
							commitment,
							maxSupportedTransactionVersion: 0,
						},
					],
				}),
				headers: {
					'content-type': 'application/json',
				},
			})
		).json()) as RPCRequestResponse<ConfirmedTransactionResponse>
		return res.result
	} catch (error) {
		return null
	}
}
