"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Header from "./components/Header";
import List from "./components/List";
import Token from "./components/Token";
import Trade from "./components/Trade";
// import Footer from "./components/Footer";

// ABIs & Config
import Factory from "./abis/Factory.json";
import config from "./config.json";
import images from "./images.json";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [factory, setFactory] = useState(null);
  const [fee, setFee] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [token, setToken] = useState(null);
  const [showTrade, setShowTrade] = useState(false);

  function toggleCreate() {
    showCreate ? setShowCreate(false) : setShowCreate(true);
  }

  function toggleTrade(token) {
    setToken(token);
    showTrade ? setShowTrade(false) : setShowTrade(true);
  }

  async function loadBlockchainData() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();

    const factory = new ethers.Contract(
      config[network.chainId].factory.address,
      Factory,
      provider
    );
    setFactory(factory);

    const fee = await factory.fee();
    setFee(fee);

    const totalTokens = await factory.totalTokens();
    const tokens = [];

    for (let i = 0; i < totalTokens; i++) {
      if (i == 8) {
        break;
      }

      const tokenSale = await factory.getTokenSale(i);

      const token = {
        token: tokenSale.token,
        name: tokenSale.name,
        creator: tokenSale.creator,
        sold: tokenSale.sold,
        raised: tokenSale.raised,
        isOpen: tokenSale.isOpen,
        image: images[i],
      };

      tokens.push(token);
    }

    setTokens(tokens.reverse());
  }

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />

      <main>
        <div onClick={factory && account && toggleCreate} className="create">
          <button className="btn--fancy">
            {!factory
              ? "[ Searching a contract... ]"
              : !account
              ? "[ Please connect ]"
              : "[ Start a new Token ]"}
          </button>
        </div>

        <div className="listings">
          <h1>New listings</h1>

          <div className="tokens">
            {!account ? (
              <p>Please connect</p>
            ) : tokens.length === 0 ? (
              <p>No tokens listed</p>
            ) : (
              tokens.map((token, index) => (
                <Token toggleTrade={toggleTrade} token={token} key={index} />
              ))
            )}
          </div>
        </div>
      </main>

      {showCreate && (
        <List
          toggleCreate={toggleCreate}
          fee={fee}
          provider={provider}
          factory={factory}
        />
      )}

      {showTrade && (
        <Trade
          toggleTrade={toggleTrade}
          token={token}
          provider={provider}
          factory={factory}
        />
      )}
    </div>
  );
}
