import express from 'express'
import {
    addTransactionToPending,
    broadcastTransaction, consensus, getBlockByHash,
    getBlockchain, getInfoByAddress, getTransactionById,
    mineBlock,
    receiveNewBlock, registerAndBroadcastNode, registerNode, registerNodesBulk
} from "../controllers/controller";

const router = express.Router()

router.get('/blockchain', getBlockchain)

router.post('/transaction', addTransactionToPending)

router.post('/transaction/broadcast', broadcastTransaction)

router.get('/mine', mineBlock)

router.post('/receive-new-block', receiveNewBlock)

router.post('/register-and-broadcast-node', registerAndBroadcastNode)

router.post('/register-node', registerNode)

router.post('/register-nodes-bulk', registerNodesBulk)

router.get('/consensus', consensus)

router.get('/block/:blockHash', getBlockByHash)

router.get('/transaction/:transactionId', getTransactionById)

router.get('/address/:address', getInfoByAddress)

export default router
