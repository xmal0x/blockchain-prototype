import express from 'express'
import bodyParser from "body-parser"
import {Blockchain, Transaction} from "./blockchain"
import { v1 } from 'uuid'
import rp from 'request-promise'

const app = express()
const port = process.argv[2]

const nodeAddress = v1().split('-').join('')

const blockchain = new Blockchain()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))


app.get('/blockchain', (req, res) => {
    res.send(blockchain)
});

app.post('/transaction', (req, res) => {
    const newTransaction = req.body
    const index = blockchain.addTransactionToPending(newTransaction)
    res.json({ message: `Transaction will be added to block ${index}` }).status(201)
})

app.post('/transaction/broadcast', (req, res) => {
    const { amount, sender, recipient } = req.body
    const newTransaction = blockchain.createNewTransaction(amount, sender, recipient)
    blockchain.addTransactionToPending(newTransaction)

    const requestPromises: Promise<void>[] = []
    blockchain.networkNodes.forEach(newtworkNodeUrl => {
        const options = {
            uri: newtworkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        }

        requestPromises.push(rp(options).promise())
    })

    Promise.all(requestPromises)
        .then(data => {
            res.json({
                message: 'Transaction created and broadcast successfully'
            })
        })
})

app.get('/mine', (req, res) => {
    const lastBlock = blockchain.getLastBlock()
    const prevBlockHash = lastBlock.hash
    const currentBlockData = {
        transactions: blockchain.pendingTransactions,
        index: lastBlock.index + 1
    }

    const nonce = blockchain.proofOfWork(prevBlockHash, currentBlockData)
    const hash = blockchain.hashBlock(prevBlockHash, nonce, currentBlockData)

    const block = blockchain.createNewBlock(nonce, hash, prevBlockHash)

    const requestPromises: Promise<void>[] = []
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const options = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: {newBlock: block},
            json: true
        }

        requestPromises.push(rp(options).promise())
    })

    Promise.all(requestPromises)
        .then(data => {
            const options = {
                uri: blockchain.nodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    amount: 12.5,
                    sender: '00',
                    recipient: nodeAddress
                },
                json: true
            }

            return rp(options)
        })
        .then(data => {
            res.json({ message: 'New block mined & broadcast successfully', block }).status(200)
        })
})

app.post('/receive-new-block', (req, res) => {
    const { newBlock } = req.body
    const lastBlock = blockchain.getLastBlock()
    const correctHash = lastBlock.hash === newBlock.previousBlockHash
    const correctIndex = lastBlock.index + 1 === newBlock.index

    if (correctHash && correctIndex) {
        blockchain.chain.push(newBlock)
        blockchain.pendingTransactions = []
        res.json({ message: 'New block received and accepted', block: newBlock }).status(200)
    } else {
        res.json({ message: 'New block rejected', block: newBlock })
    }

})

app.post('/register-and-broadcast-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl as string
    if (blockchain.networkNodes.indexOf(newNodeUrl) === -1) {
        blockchain.networkNodes.push(newNodeUrl)
    }

    const regNodesPromises: Promise<void>[] = []
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const options = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl },
            json: true
        }

        regNodesPromises.push(rp(options).promise())
    })

    Promise.all(regNodesPromises)
        .then(() => {
            const options = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...blockchain.networkNodes, blockchain.nodeUrl] },
                json: true
            }

            return rp(options)
        })
        .then(() => {
            res.json({ message: 'New node registered with network successfully' }).status(201)
        })
})

app.post('/register-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl
    // TODO move this to blockchain logic
    const notAlreadyAdded = blockchain.networkNodes.indexOf(newNodeUrl) === -1
    const notCurrentNode = blockchain.nodeUrl !== newNodeUrl
    if (notAlreadyAdded && notCurrentNode) {
        blockchain.networkNodes.push(newNodeUrl)
    }
    res.json({message: 'New node registered successfully on node'})
})

app.post('/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes as string[]
    allNetworkNodes.forEach(networkNodeUrl => {
        const notAlreadyAdded = blockchain.networkNodes.indexOf(networkNodeUrl) === -1
        const notCurrentNode = blockchain.nodeUrl !== networkNodeUrl
        if (notAlreadyAdded && notCurrentNode) {
            blockchain.networkNodes.push(networkNodeUrl)
        }
    })

    res.json({message: 'Bulk registration successful'})
})

app.get('/consensus', (req, res) => {
    const requestPromises: Promise<Blockchain>[] = []
    blockchain.networkNodes.forEach(networkNodeUrl => {
        const options = {
            uri: networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        }

        requestPromises.push(rp(options).promise())
    })

    Promise.all(requestPromises)
        .then(blockchains => {
            const currentChainLength = blockchain.chain.length
            let maxChainLength = currentChainLength
            let newLongestChain = null
            let newPendingTransactions: Transaction[] = []
            blockchains.forEach(bc => {
                if(bc.chain.length > maxChainLength) {
                    maxChainLength = bc.chain.length
                    newLongestChain = bc.chain
                    newPendingTransactions = bc.pendingTransactions
                }
            })

            if(newLongestChain && blockchain.chainIsValid(newLongestChain)) {
                blockchain.chain = newLongestChain
                blockchain.pendingTransactions = newPendingTransactions
                res.json({
                    message: 'This chain has been replaced',
                    chain: blockchain.chain
                })
            } else {
                res.json({
                    message: 'This chain has not been replaced',
                    chain: blockchain.chain
                })
            }
        })
})

app.get('/block/:blockHash', (req, res) => {
    const blockHash = req.params.blockHash
    const block = blockchain.getBlock(blockHash)
    res.json({
        block
    })
})

app.get('/transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId
    const data = blockchain.getTransaction(transactionId)
    res.json(data)
})

app.get('/address/:address', (req, res) => {
    const address = req.params.address
    const addressData = blockchain.getAddress(address)
    res.json({
        addressData
    })
})

app.listen(port, () => {
    console.log(`Server is running at ${port} port`);
});
