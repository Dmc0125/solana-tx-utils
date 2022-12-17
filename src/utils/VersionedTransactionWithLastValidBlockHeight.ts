import { TransactionMessage, TransactionMessageArgs, VersionedTransaction } from '@solana/web3.js'

type Params = TransactionMessageArgs & {
	lastValidBlockHeight: number
}

export class VersionedTransactionWithLastValidBlockHeight extends VersionedTransaction {
	lastValidBlockHeight: number

	constructor(
		{ lastValidBlockHeight, instructions, payerKey, recentBlockhash }: Params,
		signatures?: Uint8Array[],
	) {
		const txMessage = new TransactionMessage({
			instructions,
			payerKey,
			recentBlockhash,
		})

		super(txMessage.compileToV0Message(), signatures)
		this.lastValidBlockHeight = lastValidBlockHeight
	}
}
