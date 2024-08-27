let contract;
let tokenContract;
let signer;
let provider;

async function loadConfig() {
    const response = await fetch('config.json');
    return await response.json();
}

async function initializeEthers() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // 检查网络是否为 Hardhat 本地网络
        const network = await provider.getNetwork();
        if (network.chainId !== 1337) {
            alert("Please switch to Hardhat local network in MetaMask");
            return;
        }

        const config = await loadConfig();
        
        signer = provider.getSigner();
        contract = new ethers.Contract(config.lendingPlatformAddress, config.lendingPlatformABI, signer);
        tokenContract = new ethers.Contract(config.tokenAddress, config.tokenABI, signer);

        return true;
    } else {
        console.log('Please install MetaMask!');
        return false;
    }
}

async function connectWallet() {
    if (await initializeEthers()) {
        try {
            await ethereum.request({ method: 'eth_requestAccounts' });
            await updateWallet();
        } catch (error) {
            console.error("User denied account access", error);
        }
    }
}

async function switchAccount() {
    if (provider) {
        try {
            await ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
            });
            await updateWallet();
        } catch (error) {
            console.error("Error switching account:", error);
        }
    } else {
        console.log('Please connect to a wallet first');
    }
}

async function updateWallet() {
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    
    const address = await signer.getAddress();
    document.getElementById('account').innerText = `Connected Account: ${address}`;
    
    updateBalances();
}

async function updateBalances() {
    const balance = await contract.getBalance();
    const borrowBalance = await contract.getBorrowBalance();
    const tokenBalance = await tokenContract.balanceOf(await signer.getAddress());
    
    document.getElementById('balance').innerText = `Deposited: ${ethers.utils.formatEther(balance)} Tokens`;
    document.getElementById('borrowBalance').innerText = `Borrowed: ${ethers.utils.formatEther(borrowBalance)} Tokens`;
    document.getElementById('tokenBalance').innerText = `Token Balance: ${ethers.utils.formatEther(tokenBalance)} Tokens`;
}

async function deposit() {
    const amount = document.getElementById('depositAmount').value;
    if (amount > 0) {
        try {
            const allowance = await tokenContract.allowance(await signer.getAddress(), contractAddress);
            if (allowance.lt(ethers.utils.parseEther(amount))) {
                const approveTx = await tokenContract.approve(contractAddress, ethers.constants.MaxUint256);
                await approveTx.wait();
            }
            const tx = await contract.deposit(ethers.utils.parseEther(amount));
            await tx.wait();
            updateBalances();
        } catch (error) {
            console.error("Error depositing:", error);
        }
    }
}

async function withdraw() {
    const amount = document.getElementById('withdrawAmount').value;
    if (amount > 0) {
        try {
            const tx = await contract.withdraw(ethers.utils.parseEther(amount));
            await tx.wait();
            updateBalances();
        } catch (error) {
            console.error("Error withdrawing:", error);
        }
    }
}

async function borrow() {
    const amount = document.getElementById('borrowAmount').value;
    if (amount > 0) {
        try {
            const tx = await contract.borrow(ethers.utils.parseEther(amount));
            await tx.wait();
            updateBalances();
        } catch (error) {
            console.error("Error borrowing:", error);
        }
    }
}

async function repay() {
    const amount = document.getElementById('repayAmount').value;
    if (amount > 0) {
        try {
            const allowance = await tokenContract.allowance(await signer.getAddress(), contractAddress);
            if (allowance.lt(ethers.utils.parseEther(amount))) {
                const approveTx = await tokenContract.approve(contractAddress, ethers.constants.MaxUint256);
                await approveTx.wait();
            }
            const tx = await contract.repay(ethers.utils.parseEther(amount));
            await tx.wait();
            updateBalances();
        } catch (error) {
            console.error("Error repaying:", error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('switchAccount').addEventListener('click', switchAccount);
});

initializeEthers();