import * as crypto from "crypto";

class Transaction {
    // To identify the transfer of funds from a user to another user in a transaction.
    constructor(
        public amount : number,
        public payer : string, // Public Key
        public payee : string // Public Key
        
    ){}

    toString(){
        return JSON.stringify(this);
    }
}

class Block {
    //  A container for multiple transactions. Like an element on a linked list, as each block has a reference to the previous block. 
    // Basic proof of work system 
    public nonce = Math.round(Math.random() * 999999999) // A one time use random number
    
    constructor(
        public prevHash : string, // Prev block hash value. 
        public transaction : Transaction,
        public timestamp = Date.now(),
    ){}

    get hash(){
        const str = JSON.stringify(this);
        // Secure hash algorithm with the length of 256 bits. A one way cryptographic function. 
        const hash = crypto.createHash('SHA256'); 
        hash.update(str).end();
        return hash.digest('hex'); // => Return the hash value in hex string format
    }
}

class Chain {
    // A linked list of blocks. In this example there should only be one blockchain. 
    public static instance = new Chain(); // A singleton instance. 
    chain: Block[];
    constructor(){
        this.chain = [new Block('', new Transaction(100, 'genesis', 'satoshi'))];
    }

    get lastBlock(){
        return this.chain[this.chain.length - 1];
    }

    // Proof of Work Mining System implementation 
    mine(nonce : number){
        // Find a number that once added to the nonce, will produce a hash that starts with four 0s. 
        let solution = 1;
        console.log('Mining....')

        while(true) {
            const hash = crypto.createHash('MD5'); // 128 bit hash. Faster computationally than sha. 
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');
            if(attempt.substr(0,4) == '0000'){
                console.log(`Solved : ${solution}`)
                return solution; // Send solution to other node where it can be verified.
            }

            solution += 1;
        }
        
    }

    addBlock( transaction : Transaction, senderPublicKey : string, signature : Buffer){
        // Naive implementation. 
        // Verify if the request is coming from the correct user.
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature)
        
        if(isValid){
            // Add a new block to the chain
            const newBlock = new Block(this.lastBlock.hash, transaction);

            this.mine(newBlock.nonce);

            this.chain.push(newBlock);
        }



    }

}

class Wallet {
    // Essentially a wrapper of public key and private key. 
    // The public key is for receiving money, and the private key is for spending money.
    public publicKey : string;
    public privateKey : string;
    constructor(){
        // Generating a public-private key pair. 
        // The RSA algorithm can be used to encrypt and decrypt a message. 
        // The format PEM is usually saved in the user's computer to be used in the future. 
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength : 2048,
            publicKeyEncoding : { type : 'spki', format: 'pem'},
            privateKeyEncoding : { type : 'pkcs8', format : 'pem'}
        });

        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }

    sendMoney(amount : number, payeePublicKey : string){
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256')
        sign.update(transaction.toString()).end()
        const signature = sign.sign(this.privateKey)
        Chain.instance.addBlock(transaction, this.publicKey, signature)
    }

}

// Example usage

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

console.log(Chain.instance)