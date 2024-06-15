# Blockchain Prototype

This project is a simple prototype of a blockchain, allowing the launch of multiple nodes with proof of work. It uses the longest chain rule for consensus.

## Key Endpoints

- GET **/blockchain**: Retrieve the blockchain
- GET **/mine**: Mine a new block
- POST **/transaction/broadcast**: Create a new transaction and synchronize it across all nodes
- POST **/register-and-broadcast-node**: Register a new node and synchronize it with existing nodes
- GET **/consensus**: Achieve consensus using the longest chain rule

## Installation

1. Clone the project:
   ```sh
   git clone https://github.com/xmal0x/blockchain-prototype.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## Usage

1. To start the server, use the scripts defined in `package.json`:
   ```sh
   npm run node ...
   ```

2. To add nodes, use the `/register-and-broadcast-node` endpoint:
    - Request body example:
      ```json
      {
        "newNodeUrl": "http://localhost:3002"
      }
      ```

3. To create a new transaction, use the `/transaction/broadcast` endpoint:
    - Request body example:
      ```json
      {
        "amount": 10,
        "recipient": "test-hash-recipient",
        "sender": "test-hash-sender"
      }
      ```

4. When adding a new node, use the `/consensus` endpoint. Register the new node and call the `/consensus` endpoint on it to synchronize it with the other nodes.

## Server

- Built with Node.js, Express, and TypeScript.

## Client

- Currently under development.
