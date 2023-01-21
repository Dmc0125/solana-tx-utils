import { Keypair, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { describe, expect, it } from 'vitest'
import { setTimeout } from 'node:timers/promises'

import {
	buildAndSignTxFromInstructions,
	confirmTransaction,
	sendAndConfirmTransaction,
	sendTransaction,
} from '../src/index.js'
import { wallet, connection } from './init.js'

describe.concurrent('polling', () => {
	it('sends and confirms successful tx', async () => {
		const destination = new Keypair()

		const txData = await buildAndSignTxFromInstructions(
			{
				payerKey: wallet.publicKey,
				signers: [wallet],
				instructions: [
					SystemProgram.transfer({
						fromPubkey: wallet.publicKey,
						toPubkey: destination.publicKey,
						lamports: 1_000_000_000,
					}),
				],
			},
			connection,
		)

		const res = await sendAndConfirmTransaction({
			...txData,
			connection,
		})

		expect(res.status).toBe('SUCCESS')
		expect(res.error).toBe(null)
	})

	it('sends and confirms tx with error', async () => {
		const destination = new Keypair()
		const txData = await buildAndSignTxFromInstructions(
			{
				payerKey: wallet.publicKey,
				signers: [wallet],
				instructions: [
					SystemProgram.transfer({
						fromPubkey: wallet.publicKey,
						toPubkey: destination.publicKey,
						lamports: 501_000_000_000,
					}),
				],
			},
			connection,
		)

		const res = await sendAndConfirmTransaction({
			...txData,
			connection,
		})

		expect(res.status).toBe('ERROR')
		expect(res.error?.programId?.equals(SystemProgram.programId)).toBe(true)
		expect(res.error?.error).toBe(1)
		expect(res.data).toBe(null)
	})

	it(
		'sends and confirms tx that times out',
		async () => {
			const mintKeypair = new Keypair()
			const txData = await buildAndSignTxFromInstructions(
				{
					payerKey: wallet.publicKey,
					signers: [wallet],
					instructions: [
						SystemProgram.createAccount({
							fromPubkey: wallet.publicKey,
							newAccountPubkey: mintKeypair.publicKey,
							space: 82,
							lamports: await connection.getMinimumBalanceForRentExemption(82),
							programId: TOKEN_PROGRAM_ID,
						}),
					],
				},
				connection,
			)

			const res = await sendAndConfirmTransaction(
				{
					...txData,
					connection,
				},
				{ maxConfirmationTime: 10_000 },
			)

			expect(res.status).toBe('TIMEOUT')
			expect(res.error).toBe(null)
			expect(res.data).toBe(null)
		},
		{ timeout: 15_000 },
	)

	it(
		'send and confirms tx with exceeded block height',
		async () => {
			const mintKeypair = new Keypair()
			const { transaction, lastValidBlockHeight } = await buildAndSignTxFromInstructions(
				{
					payerKey: wallet.publicKey,
					signers: [wallet],
					instructions: [
						SystemProgram.createAccount({
							fromPubkey: wallet.publicKey,
							newAccountPubkey: mintKeypair.publicKey,
							space: 82,
							lamports: await connection.getMinimumBalanceForRentExemption(82),
							programId: TOKEN_PROGRAM_ID,
						}),
					],
				},
				connection,
			)

			const txId = await sendTransaction({ transaction, connection })

			let currentBlockHeight = 0
			while (currentBlockHeight < lastValidBlockHeight) {
				currentBlockHeight = await connection.getBlockHeight()
				await setTimeout(3000)
			}

			const res = await confirmTransaction({
				txId,
				connection,
				lastValidBlockHeight,
			})

			expect(res.status).toBe('BLOCK_HEIGHT_EXCEEDED')
			expect(res.data).toBe(null)
			expect(res.error).toBe(null)
		},
		{ timeout: 300_000 },
	)
})
