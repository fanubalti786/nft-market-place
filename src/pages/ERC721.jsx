import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { erc721Address, erc721Abi } from "../constant";

export default function ERC721() {
  // --- Core state ---
  const [account, setAccount] = useState(null);
  const [networkName, setNetworkName] = useState("");
  const [chainIdNumber, setChainIdNumber] = useState("");
  const [contract, setContract] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState("");

  // --- nft metadata inputs ---
  const [nftName, setNftName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);


   // TX hashes
  const [nftMintedHash, setnftMintedHash] = useState("");

  // Inputs
  // const [name, setName] = useState("");
  // const [age, setAge] = useState("");
  // const [newName, setNewName] = useState("");
  // const [depositAmount, setDepositAmount] = useState("");
  // const [withdrawAmount, setWithdrawAmount] = useState("");

  // // State
  // const [users, setUsers] = useState([]);
  // const [currentUser, setCurrentUser] = useState(null);
  // const [contractBal, setContractBal] = useState(null);

  // // TX hashes
  // const [registerHash, setRegisterHash] = useState("");
  // const [updateHash, setUpdateHash] = useState("");
  // const [depositHash, setDepositHash] = useState("");
  // const [withdrawHash, setWithdrawHash] = useState("");
  // const [ownerWithdrawHash, setOwnerWithdrawHash] = useState("");

  // // Event arrays
  // const [userRegisteredEvents, setUserRegisteredEvents] = useState([]);
  // const [userUpdatedEvents, setUserUpdatedEvents] = useState([]);
  // const [depositEvents, setDepositEvents] = useState([]);
  // const [withdrawEvents, setWithdrawEvents] = useState([]);
  // const [ownerWithdrawEvents, setOwnerWithdrawEvents] = useState([]);

  // // My account events
  // const [myEvents, setMyEvents] = useState([]);

  // // UI toggles (collapsible sections)
  // const [showRegistered, setShowRegistered] = useState(true);
  // const [showUpdated, setShowUpdated] = useState(false);
  // const [showDeposits, setShowDeposits] = useState(false);
  // const [showWithdraws, setShowWithdraws] = useState(false);
  // const [showOwnerWithdraws, setShowOwnerWithdraws] = useState(false);

  // Simple error UI
  const showError = (error) => {
    const msg = "Transaction failed!";
    alert(msg);
  };

  // ---------- Wallet connect ----------
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const myContract = new ethers.Contract(erc721Address, erc721Abi, signer);
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setContract(myContract);
      setNetworkName(network.name);
      setChainIdNumber(network.chainId?.toString?.() || "");
      const owner = await myContract.owner();
      setOwnerAddress(owner);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet!");
    }
  };


  const uploadToIPFS = async file => {
    if(file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios({
          method: 'POST',
          url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
          data: formData,
          headers:{
            pinata_api_key: 'febc8bcc2e0247748719',
            pinata_secret_api_key: '0b23f6b60caf043d5718d773b8c4d877048a5f63966e1c4399e5d2bc733fd0d3',
            'Content-Type': 'multipart/form-data',
          },

        })

        console.log("Image uploaded to Pinata:" ,response.data.IpfsHash);
        const CID = response.data.IpfsHash;
        return CID

      } catch (error) {
  console.log("UPLOAD ERROR:", error.response?.data || error.message);
  alert("uploadToIpfs failed");
}

    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!contract) return alert("Contract not Connected");
    if (!nftName || !description || !image) {
      alert("Please fill all fields");
      return;
    }


    const CID = await uploadToIPFS(image);
    if(!CID) return alert("image upload failed.");

    const metadataCID = await pinJSONToIPFS(nftName,description,CID);
    console.log("Metadata CID : ", CID);

    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;
    console.log("metadata URL: ", metadataUrl);

    // call the contract safeMint function

    try {
      const tx = await contract.safeMint(metadataUrl);
      await reciept.wait();
      alert(`NftMinted successfully Congrates tx : ${reciept.hash}`);
      setnftMintedHash(reciept.hash);
      // Extract Event from reciept
      const event = reciept.logs
      .map((log) =>{
        try {
          return contract.interface.parseLog(log);
        } catch (error) {
          
        }
      })
      .find((parsed) => parsed && parsed.name === 'NFTMinted');

      if(event) {
        const tokenId = event.args.tokenId;
        console.log('NFT minted with Token ID: ', tokenId);
        alert(`NFT minted! Token ID: ${tokenId}`);
      }
      else{
        alert('NFTMinted not found in reciept');
      }

      setNftName("");
      setDescription("");
      setImage(null);
    } catch (error) {
      showError(error);
    }

   
  };


  const pinJSONToIPFS = async (nftName,description,CID) => {
    try {
      const data = JSON.stringify({
        nftName,
        description,
        image: `https://gateway.pinata.cloud/ipfs/${CID}`,
      })

      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS',{
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxZjRkOGQ5OC00YzMwLTRhNmEtYmExNC0zNzcyMTZkZTJhYjAiLCJlbWFpbCI6ImZhbnViYWx0aTc4NkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZmViYzhiY2MyZTAyNDc3NDg3MTkiLCJzY29wZWRLZXlTZWNyZXQiOiIwYjIzZjZiNjBjYWYwNDNkNTcxOGQ3NzNiOGM0ZDg3NzA0OGE1ZjYzOTY2ZTFjNDM5OWU1ZDJiYzczM2ZkMGQzIiwiZXhwIjoxNzk5NzUwOTA1fQ.4kzAsIDdbHUfxViazyj3aXzMlr9G1zL3ymoVNlnFY0s'
        },
        body: data,
      })

      const resData = await res.json();
      console.log('Metadata uploaded with image CID:', resData.IpfsHash);
      return resData.IpfsHash;
    } catch (error) {
  console.log("UPLOAD ERROR:", error.response?.data || error.message);
  alert("uploadToIpfs failed");
}


  }

  // ---------- Core tx functions ----------
  // const register = async () => {
  //   if (!contract) return alert("Connect wallet first!");
  //   if (!name || !age) return alert("Please fill all fields!");
  //   try {
  //     const tx = await contract.register(name, parseInt(age));
  //     await tx.wait();
  //     setRegisterHash(tx.hash);
  //     setName("");
  //     setAge("");
  //   } catch (error) {
  //     showError(error);
  //   }
  // };

  // const updateUser = async () => {
  //   if (!contract) return alert("Connect wallet first!");
  //   if (!newName) return alert("Enter new name!");
  //   try {
  //     const tx = await contract.updateUser(newName);
  //     await tx.wait();
  //     setUpdateHash(tx.hash);
  //     setNewName("");
  //   } catch (error) {
  //     showError(error);
  //   }
  // };

  // const deposit = async () => {
  //   if (!contract) return alert("Connect wallet first!");
  //   if (!depositAmount || parseFloat(depositAmount) <= 0)
  //     return alert("Enter valid amount!");
  //   try {
  //     const tx = await contract.deposit({
  //       value: ethers.parseEther(depositAmount),
  //     });
  //     await tx.wait();
  //     setDepositHash(tx.hash);
  //     setDepositAmount("");
  //   } catch (error) {
  //     showError(error);
  //   }
  // };

  // const withdraw = async () => {
  //   if (!contract) return alert("Connect wallet first!");
  //   if (!withdrawAmount || parseFloat(withdrawAmount) <= 0)
  //     return alert("Enter valid amount!");
  //   try {
  //     const tx = await contract.withdraw(ethers.parseEther(withdrawAmount));
  //     await tx.wait();
  //     setWithdrawHash(tx.hash);
  //     setWithdrawAmount("");
  //   } catch (error) {
  //     showError(error);
  //   }
  // };

  // const withdrawAllToOwner = async () => {
  //   if (!contract) return alert("Connect wallet first!");
  //   if (!account || !ownerAddress)
  //     return alert("Owner check failed — reconnect wallet.");
  //   if (account.toLowerCase() !== ownerAddress.toLowerCase())
  //     return alert("Only owner can use this!");
  //   try {
  //     const tx = await contract.withdrawAllToOwner();
  //     await tx.wait();
  //     setOwnerWithdrawHash(tx.hash);
  //   } catch (error) {
  //     showError(error);
  //   }
  // };

 

  // ---------- Auto handle accounts/network ----------
  useEffect(() => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);

    const syncWallet = async () => {
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length === 0) {
        setAccount(null);
        setContract(null);
        return;
      }

      setAccount(accounts[0]);

      const network = await provider.getNetwork();
      setNetworkName(network.name);
      setChainIdNumber(Number(network.chainId));

      const signer = await provider.getSigner();
      const myContract = new ethers.Contract(erc721Address, erc721Abi, signer);
      setContract(myContract);

      const owner = await myContract.owner();
      setOwnerAddress(owner);
    };

    // initial load
    syncWallet();

    // account change (NO reload)
    window.ethereum.on("accountsChanged", syncWallet);

    // network change (MetaMask reload behavior)
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    return () => {
      window.ethereum.removeListener("accountsChanged", syncWallet);
      window.ethereum.removeListener("chainChanged", () =>
        window.location.reload()
      );
    };
  }, []);

  // ---------- Events: fetch past + realtime ----------
  // useEffect(() => {
  //   if (!contract) return;

  //   const fetchPastEvents = async () => {
  //     try {
  //       // UserRegistered
  //       const pastRegs = await contract.queryFilter(
  //         contract.filters.UserRegistered(),
  //         0,
  //         "latest"
  //       );
  //       setUserRegisteredEvents(
  //         pastRegs
  //           .map((e) => ({
  //             wallet: e.args.wallet,
  //             name: e.args.name,
  //             age: Number(e.args.age),
  //             txHash: e.transactionHash,
  //           }))
  //           .reverse()
  //       );

  //       // UserUpdated
  //       const pastUpdates = await contract.queryFilter(
  //         contract.filters.UserUpdated(),
  //         0,
  //         "latest"
  //       );
  //       setUserUpdatedEvents(
  //         pastUpdates
  //           .map((e) => ({
  //             wallet: e.args.wallet,
  //             name: e.args.name,
  //             txHash: e.transactionHash,
  //           }))
  //           .reverse()
  //       );

  //       // EtherDeposited
  //       const pastDeposits = await contract.queryFilter(
  //         contract.filters.EtherDeposited(),
  //         0,
  //         "latest"
  //       );
  //       setDepositEvents(
  //         pastDeposits
  //           .map((e) => ({
  //             wallet: e.args.wallet,
  //             amount: e.args.amount,
  //             txHash: e.transactionHash,
  //           }))
  //           .reverse()
  //       );

  //       // EtherWithdrawn
  //       const pastWithdraws = await contract.queryFilter(
  //         contract.filters.EtherWithdrawn(),
  //         0,
  //         "latest"
  //       );
  //       setWithdrawEvents(
  //         pastWithdraws
  //           .map((e) => ({
  //             wallet: e.args.wallet,
  //             amount: e.args.amount,
  //             txHash: e.transactionHash,
  //           }))
  //           .reverse()
  //       );

  //       // OwnerWithdrawAll
  //       const pastOwner = await contract.queryFilter(
  //         contract.filters.OwnerWithdrawAll(),
  //         0,
  //         "latest"
  //       );
  //       setOwnerWithdrawEvents(
  //         pastOwner
  //           .map((e) => ({
  //             amount: e.args.amount,
  //             txHash: e.transactionHash,
  //           }))
  //           .reverse()
  //       );
  //     } catch (err) {
  //       console.error("Error fetching past events:", err);
  //     }
  //   };

  //   fetchPastEvents();

  //   // Real-time listeners
  //   const handleUserRegistered = (wallet, name, age, event) => {
  //     setUserRegisteredEvents((prev) => [
  //       { wallet, name, age: Number(age), txHash: event.transactionHash },
  //       ...prev,
  //     ]);
  //   };
  //   const handleUserUpdated = (wallet, name, event) => {
  //     setUserUpdatedEvents((prev) => [
  //       { wallet, name, txHash: event.transactionHash },
  //       ...prev,
  //     ]);
  //   };
  //   const handleDeposit = (wallet, amount, event) => {
  //     setDepositEvents((prev) => [
  //       { wallet, amount, txHash: event.transactionHash },
  //       ...prev,
  //     ]);
  //   };
  //   const handleWithdraw = (wallet, amount, event) => {
  //     setWithdrawEvents((prev) => [
  //       { wallet, amount, txHash: event.transactionHash },
  //       ...prev,
  //     ]);
  //   };
  //   const handleOwnerWithdraw = (amount, event) => {
  //     setOwnerWithdrawEvents((prev) => [
  //       { amount, txHash: event.transactionHash },
  //       ...prev,
  //     ]);
  //   };

  //   contract.on("UserRegistered", handleUserRegistered);
  //   contract.on("UserUpdated", handleUserUpdated);
  //   contract.on("EtherDeposited", handleDeposit);
  //   contract.on("EtherWithdrawn", handleWithdraw);
  //   contract.on("OwnerWithdrawAll", handleOwnerWithdraw);

  //   return () => {
  //     contract.off("UserRegistered", handleUserRegistered);
  //     contract.off("UserUpdated", handleUserUpdated);
  //     contract.off("EtherDeposited", handleDeposit);
  //     contract.off("EtherWithdrawn", handleWithdraw);
  //     contract.off("OwnerWithdrawAll", handleOwnerWithdraw);
  //   };
  // }, [contract]);

  // // ---------- My events (connected account only) ----------
  // const filterMyEvents = async () => {
  //   if (!contract) return alert("Connect wallet first!");
  //   if (!account) return alert("No wallet connected!");
  //   try {
  //     // If events have indexed wallet field, you can pass account as arg to filter.
  //     const allRegs = await contract.queryFilter(
  //       contract.filters.UserRegistered(account),
  //       0,
  //       "latest"
  //     );
  //     const allUpdates = await contract.queryFilter(
  //       contract.filters.UserUpdated(account),
  //       0,
  //       "latest"
  //     );
  //     const allDeposits = await contract.queryFilter(
  //       contract.filters.EtherDeposited(account),
  //       0,
  //       "latest"
  //     );
  //     const allWithdraws = await contract.queryFilter(
  //       contract.filters.EtherWithdrawn(account),
  //       0,
  //       "latest"
  //     );

  //     const formatted = [
  //       ...allRegs.map((e) => ({
  //         type: "Registered",
  //         name: e.args.name,
  //         age: Number(e.args.age),
  //         txHash: e.transactionHash,
  //       })),
  //       ...allUpdates.map((e) => ({
  //         type: "Updated",
  //         name: e.args.name,
  //         txHash: e.transactionHash,
  //       })),
  //       ...allDeposits.map((e) => ({
  //         type: "Deposited",
  //         amount: ethers.formatEther(e.args.amount),
  //         txHash: e.transactionHash,
  //       })),
  //       ...allWithdraws.map((e) => ({
  //         type: "Withdrew",
  //         amount: ethers.formatEther(e.args.amount),
  //         txHash: e.transactionHash,
  //       })),
  //     ].reverse();

  //     setMyEvents(formatted);
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to fetch your events!");
  //   }
  // };

  // ---------- Layout UI ----------
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-[#0b1220]/80 to-[#0b0920]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              ERC721
            </div>
            <div className="text-xs text-gray-400">Sepolia • Demo</div>
          </div>

          <div className="flex items-center gap-3">
            {!account ? (
              <button
                onClick={connectWallet}
                className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/3 backdrop-blur-sm rounded-2xl p-2 px-3 border border-white/5">
                <div className="text-xs text-indigo-200">
                  {networkName} ({chainIdNumber})
                </div>
                <div className="px-2 py-1 rounded bg-white/5 text-xs break-all">
                  {account.slice(0, 8)}...{account.slice(-6)}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Account Info */}
          <div className="space-y-4">
            <div className="rounded-2xl p-4 bg-white/3 backdrop-blur-sm border border-white/6 shadow-lg">
              <h4 className="text-sm font-semibold text-indigo-100 mb-2">
                Wallet
              </h4>

              {!account ? (
                <div className="text-sm text-gray-300">
                  Please connect your wallet.
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-200 break-all">
                    {account}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Owner: {ownerAddress || "—"}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT: NFT FORM */}
          <div className="lg:col-span-2">
            <div className="max-w-lg mx-auto p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-indigo-200 mb-4">
               ERC721 NFT Minter
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* NFT Name */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    NFT Name
                  </label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    NFT Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="w-full text-sm text-gray-300
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-lg file:border-0
                             file:bg-indigo-600 file:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium"
                >
                  MintNFT
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
