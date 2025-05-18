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
  const [tokenImages, setTokenImages] = useState(images);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenImageMap, setTokenImageMap] = useState({});

  // Fungsi untuk memuat gambar token dari API
  const loadTokenImagesFromAPI = async () => {
    try {
      const response = await fetch('/api/token-images');
      if (response.ok) {
        const data = await response.json();
        if (data.images && Array.isArray(data.images)) {
          setTokenImages(data.images);
        }
      }
    } catch (error) {
      console.error('Error loading token images from API:', error);
      // Fallback ke images.json jika API gagal
      setTokenImages(images);
    }
  };

  // Fungsi untuk memuat pemetaan token dari API
  const loadTokenImageMapFromAPI = async () => {
    try {
      const response = await fetch('/api/token-images?map=true');
      if (response.ok) {
        const data = await response.json();
        if (data.tokenMap && typeof data.tokenMap === 'object') {
          console.log("Loaded token image map from API:", data.tokenMap);
          setTokenImageMap(data.tokenMap);
          
          // Simpan juga ke localStorage untuk akses offline
          localStorage.setItem('tokenImageMap', JSON.stringify(data.tokenMap));
          
          return data.tokenMap;
        }
      }
      return {};
    } catch (error) {
      console.error('Error loading token image map from API:', error);
      return {};
    }
  };

  // Fungsi untuk memuat pemetaan token dari localStorage
  const loadTokenImageMap = () => {
    try {
      const savedMap = localStorage.getItem('tokenImageMap');
      if (savedMap) {
        const parsedMap = JSON.parse(savedMap);
        console.log("Loaded token image map from localStorage:", parsedMap);
        setTokenImageMap(parsedMap);
        return parsedMap;
      }
      return {};
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return {};
    }
  };

  function toggleCreate() {
    showCreate ? setShowCreate(false) : setShowCreate(true);
  }

  function toggleTrade(token) {
    setToken(token);
    showTrade ? setShowTrade(false) : setShowTrade(true);
  }

  // Fungsi untuk menambahkan gambar token baru dan menyimpan pemetaan
  const addTokenImage = (tokenAddress, imageUrl) => {
    // Pastikan alamat token dalam format lowercase untuk konsistensi
    const normalizedAddress = tokenAddress.toLowerCase();
    
    console.log(`Adding token image mapping: ${normalizedAddress} -> ${imageUrl}`);
    
    // Tambahkan gambar baru ke array tokenImages
    // Gunakan unshift untuk menambahkan di awal array (posisi 0)
    setTokenImages(prevImages => {
      const newImages = [imageUrl, ...prevImages];
      console.log("Updated token images array:", newImages);
      return newImages;
    });
    
    // Simpan pemetaan alamat token ke URL gambar
    setTokenImageMap(prevMap => {
      const updatedMap = {
        ...prevMap,
        [normalizedAddress]: imageUrl
      };
      
      // Simpan pemetaan ke localStorage untuk persistensi
      try {
        localStorage.setItem('tokenImageMap', JSON.stringify(updatedMap));
        console.log("Updated token image map in localStorage:", updatedMap);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      return updatedMap;
    });
    
    // Muat ulang data blockchain setelah menambahkan token baru
    setTimeout(() => {
      console.log("Reloading blockchain data after adding new token");
      loadBlockchainData();
    }, 1000); // Tunggu 1 detik untuk memastikan blockchain sudah diperbarui
  };

  async function loadBlockchainData() {
    setIsLoading(true);
    try {
      // Muat pemetaan token dari API terlebih dahulu
      let currentMap = await loadTokenImageMapFromAPI();
      
      // Jika API gagal atau tidak ada data, fallback ke localStorage
      if (Object.keys(currentMap).length === 0) {
        currentMap = loadTokenImageMap();
      }
      
      // Muat gambar token dari API
      await loadTokenImagesFromAPI();

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

      // Ambil semua token terlebih dahulu
      for (let i = 0; i < totalTokens; i++) {
        if (i == 8) {
          break;
        }

        const tokenSale = await factory.getTokenSale(i);
        const tokenAddress = tokenSale.token.toLowerCase();

        console.log(`Token ${i}: ${tokenAddress}`);
        
        // Cek apakah token ada dalam pemetaan
        let tokenImage;
        
        if (currentMap[tokenAddress]) {
          // Gunakan gambar dari pemetaan jika ada
          tokenImage = currentMap[tokenAddress];
          console.log(`Using image from map for ${tokenAddress}: ${tokenImage}`);
        } else if (tokenImages.length > i) {
          // Jika tidak ada di pemetaan, gunakan gambar default
          tokenImage = "https://crimson-wooden-parakeet-235.mypinata.cloud/ipfs/QmfFEKp9zFzTmcDjHLXi5H6E5dnKn8NjeaT5ZN2yenFfUR";
          console.log(`Using default image for ${tokenAddress}`);
          
          // Simpan pemetaan ini untuk penggunaan di masa depan
          console.log(`Adding default image to map for ${tokenAddress}: ${tokenImage}`);
          
          // Update pemetaan
          currentMap[tokenAddress] = tokenImage;
          setTokenImageMap(currentMap);
          
          // Simpan ke localStorage
          localStorage.setItem('tokenImageMap', JSON.stringify(currentMap));
        } else {
          // Jika tidak ada di keduanya, gunakan gambar default
          tokenImage = "https://crimson-wooden-parakeet-235.mypinata.cloud/ipfs/QmfFEKp9zFzTmcDjHLXi5H6E5dnKn8NjeaT5ZN2yenFfUR";
          console.log(`Using default image for ${tokenAddress}`);
        }

        const token = {
          token: tokenSale.token,
          name: tokenSale.name,
          creator: tokenSale.creator,
          sold: tokenSale.sold,
          raised: tokenSale.raised,
          isOpen: tokenSale.isOpen,
          image: tokenImage,
          index: i // Tambahkan indeks asli untuk mempertahankan urutan
        };

        tokens.push(token);
      }

      // Urutkan token berdasarkan indeks (terbaru di awal)
      // Ini akan memastikan token terbaru muncul di kanan dengan gambar yang benar
      const sortedTokens = [...tokens].sort((a, b) => a.index - b.index);
      
      console.log("Tokens before sorting:", tokens.map(t => ({ 
        index: t.index, 
        address: t.token, 
        name: t.name, 
        image: t.image 
      })));
      
      console.log("Tokens after sorting:", sortedTokens.map(t => ({ 
        index: t.index, 
        address: t.token, 
        name: t.name, 
        image: t.image 
      })));
      
      setTokens(sortedTokens);
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Bersihkan localStorage untuk memastikan pemetaan yang benar
    localStorage.removeItem('tokenImageMap');
    
    loadBlockchainData();
  }, []);

  // Jangan reload data ketika tokenImages berubah karena ini bisa menyebabkan loop
  // dan kehilangan pemetaan yang baru saja dibuat
  // useEffect(() => {
  //   if (!isLoading) {
  //     loadBlockchainData();
  //   }
  // }, [tokenImages]);

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
            ) : isLoading ? (
              <div className="loading-container">
                <p>Loading tokens...</p>
              </div>
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
          addTokenImage={addTokenImage}
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
