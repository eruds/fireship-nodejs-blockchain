"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
class Transaction {
    // To identify the transfer of funds from a user to another user in a transaction.
    constructor(amount, payer, // Public Key
    payee // Public Key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    toString() {
        return JSON.stringify(this);
    }
}
class Block {
    constructor(prevHash, // Prev block hash value. 
    transaction, timestamp = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.timestamp = timestamp;
        //  A container for multiple transactions. Like an element on a linked list, as each block has a reference to the previous block. 
        // Basic proof of work system 
        this.nonce = Math.round(Math.random() * 999999999); // A one time use random number
    }
    get hash() {
        const str = JSON.stringify(this);
        // Secure hash algorithm with the length of 256 bits. A one way cryptographic function. 
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex'); // => Return the hash value in hex string format
    }
}
class Chain {
    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    // Proof of Work Mining System implementation 
    mine(nonce) {
        // Find a number that once added to the nonce, will produce a hash that starts with four 0s. 
        let solution = 1;
        console.log('Mining....');
        while (true) {
            const hash = crypto.createHash('MD5'); // 128 bit hash. Faster computationally than sha. 
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substr(0, 4) == '0000') {
                console.log(`Solved : ${solution}`);
                return solution; // Send solution to other node where it can be verified.
            }
            solution += 1;
        }
    }
    addBlock(transaction, senderPublicKey, signature) {
        // Naive implementation. 
        // Verify if the request is coming from the correct user.
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            // Add a new block to the chain
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}
// A linked list of blocks. In this example there should only be one blockchain. 
Chain.instance = new Chain(); // A singleton instance. 
class Wallet {
    constructor() {
        // Generating a public-private key pair. 
        // The RSA algorithm can be used to encrypt and decrypt a message. 
        // The format PEM is usually saved in the user's computer to be used in the future. 
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
// Example usage
const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();
satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);
console.log(Chain.instance);
