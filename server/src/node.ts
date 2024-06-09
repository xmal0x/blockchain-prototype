import express from 'express'
import bodyParser from "body-parser"
import {Blockchain} from "./blockchain"
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
    const { amount, sender, recipient } = req.body
    const index = blockchain.createNewTransaction(amount, sender, recipient)
    res.json({ message: `Transaction will be added to block ${index}` }).status(201)
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

    // mined reward
    blockchain.createNewTransaction(12.5, '00', nodeAddress)

    const block = blockchain.createNewBlock(nonce, hash, prevBlockHash)
    res.json({ message: 'New block mined successfully', block }).status(200)
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

app.listen(port, () => {
    console.log(`Server is running at ${port} port`);
});
