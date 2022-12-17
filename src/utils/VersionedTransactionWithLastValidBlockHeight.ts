import {
	AddressLookupTableAccount,
	TransactionMessage,
	TransactionMessageArgs,
	VersionedTransaction,
} from '@solana/web3.js'

type Params = TransactionMessageArgs & {
	lastValidBlockHeight: number
	addressLookupTables?: AddressLookupTableAccount[]
}

export class VersionedTransactionWithLastValidBlockHeight extends VersionedTransaction {
	lastValidBlockHeight: number

	constructor(
		{ lastValidBlockHeight, instructions, payerKey, recentBlockhash, addressLookupTables }: Params,
		signatures?: Uint8Array[],
	) {
		const txMessage = new TransactionMessage({
			instructions,
			payerKey,
			recentBlockhash,
		})

		super(txMessage.compileToV0Message(addressLookupTables), signatures)
		this.lastValidBlockHeight = lastValidBlockHeight
	}
}
