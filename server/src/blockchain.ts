import sha256 from 'sha256'
import { v1 } from 'uuid'

const nodeUrl = process.argv[3]

type Block = {
    index: number
    timestamp: number
    transactions: Transaction[]
    nonce: number
    hash: string
    previousBlockHash: string
}

type BlockData = {
    index: number
    transactions: Transaction[]
}

export type Transaction = {
    amount: number
    sender: string
    recipient: string
    transactionId: string
}

export class Blockchain {
    chain: Block[]
    pendingTransactions: Transaction[]
    nodeUrl = ''
    networkNodes: string[] = []

    constructor() {
        this.chain = []
        this.pendingTransactions = []
        this.nodeUrl = nodeUrl
        this.networkNodes = []

        this.createNewBlock(0, '0', '0')
    }

    createNewBlock(nonce: number, hash: string, previousBlockHash: string): Block {
        const block = {
            nonce,
            hash,
            previousBlockHash,
            index: this.chain.length + 1,
            timestamp: Date.now(),
            transactions: this.pendingTransactions
        }

        this.pendingTransactions = []
        this.chain.push(block)

        return block
    }

    getLastBlock(): Block {
        return this.chain[this.chain.length - 1]
    }

    createNewTransaction(amount: number, sender: string, recipient: string): Transaction {
        return {
            amount,
            sender,
            recipient,
            transactionId: v1().split('-').join('')
        }
    }

    addTransactionToPending(transaction: Transaction): number {
        this.pendingTransactions.push(transaction)
        return this.getLastBlock().index + 1
    }

    hashBlock(previousHashBlock: string, nonce: number, currentBlockData: BlockData): string {
        const dataAsString = previousHashBlock + nonce + JSON.stringify(currentBlockData)
        return sha256(dataAsString)
    }

    proofOfWork(previousHashBlock: string, currentBlockData: BlockData): number {
        let nonce = 0
        let hash = this.hashBlock(previousHashBlock, nonce, currentBlockData)

        while(!hash.startsWith('0000')) {
            nonce++
            hash = this.hashBlock(previousHashBlock, nonce, currentBlockData)
        }

        return nonce
    }

    chainIsValid(chain: Block[]): boolean {
        let validChain = true

        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i]
            const prevBlock = chain[i-1]

            const blockHash = this.hashBlock(prevBlock.hash, currentBlock.nonce, {transactions: currentBlock.transactions, index: currentBlock.index})

            if(!blockHash.startsWith('0000')) {
                validChain = false
            }

            if (currentBlock.previousBlockHash !== prevBlock.hash) {
                validChain = false
            }
        }

        const genesisBlock = chain[0]
        const correctNonce = genesisBlock.nonce === 0
        const correctPrevHash = genesisBlock.previousBlockHash = '0'
        const correctHash = genesisBlock.hash === '0'
        const correctTransactions = genesisBlock.transactions.length === 0

        if(!correctNonce || !correctHash || !correctPrevHash || !correctTransactions) {
            validChain = false
        }

        return validChain
    }

    getBlock(blockHash: string): Block | null {
        return this.chain.find(b => b.hash === blockHash) || null
    }

    getTransaction(transactionId: string) {
        let foundTransaction = null
        let foundBlock = null

        this.chain.forEach(block => {
            const transaction = block.transactions.find(t => t.transactionId === transactionId)
            if (transaction) {
                foundBlock = block
                foundTransaction = transaction
            }
        })

        return {
            transaction: foundTransaction,
            block: foundBlock
        }
    }

    getAddress(address: string) {
        const foundTransactions: Transaction[] = []
        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.sender === address || transaction.recipient === address) {
                    foundTransactions.push(transaction)
                }
            })
        })

        let balance = 0
        foundTransactions.forEach(transaction => {
            if (transaction.sender === address) {
                balance -= transaction.amount
            } else {
                balance += transaction.amount
            }
        })

        return {
            foundTransactions,
            balance
        }
    }
}
