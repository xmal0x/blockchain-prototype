import sha256 from 'sha256'

type Block = {
    index: number
    timestamp: number
    transactions: Transaction[]
    nonce: number
    hash: string
    previousBlockHash: string
}

type Transaction = {
    amount: number
    sender: string
    recipient: string
}

export class Blockchain {
    private readonly chain: Block[]
    private pendingTransactions: Transaction[]

    constructor() {
        this.chain = []
        this.pendingTransactions = []

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

    createNewTransaction(amount: number, sender: string, recipient: string): number {
        const transaction = {
            amount,
            sender,
            recipient
        }

        this.pendingTransactions.push(transaction)

        return this.getLastBlock().index + 1
    }

    hashBlock(previousHashBlock: string, nonce: number, currentBlockData: Block): string {
        const dataAsString = previousHashBlock + nonce + JSON.stringify(currentBlockData)
        return sha256(dataAsString)
    }

    proofOfWork(previousHashBlock: string, currentBlockData: Block): number {
        let nonce = 0
        let hash = this.hashBlock(previousHashBlock, nonce, currentBlockData)

        while(!hash.startsWith('0000')) {
            nonce++
            hash = this.hashBlock(previousHashBlock, nonce, currentBlockData)
        }

        return nonce
    }
}
