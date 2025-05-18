import { ethers } from "ethers";
import { useState, useEffect } from "react";
import { uploadImageToPinata } from "../services/ipfsService";
import Spinner from "./Spinner";

function List({ toggleCreate, fee, provider, factory, addTokenImage }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Tambahkan class modal-open ke body saat komponen dimuat
  useEffect(() => {
    document.body.classList.add('modal-open');
    
    // Hapus class saat komponen di-unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fungsi untuk menyimpan URL gambar token melalui API
  const saveTokenImageUrl = async (imageUrl, tokenAddress) => {
    try {
      const response = await fetch('/api/token-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, tokenAddress }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save token image');
      }

      return true;
    } catch (error) {
      console.error('Error saving token image:', error);
      return false;
    }
  };

  async function listHandler(form) {
    try {
      setIsUploading(true);
      setUploadError(null);
  
      const name = form.get("name");
      const ticker = form.get("ticker");
      
      let imageUrl = "";
      
      if (imageFile) {
        // Upload gambar ke IPFS jika ada
        imageUrl = await uploadImageToPinata(imageFile);
      } else {
        // Gunakan gambar default jika tidak ada yang diunggah
        imageUrl = "https://crimson-wooden-parakeet-235.mypinata.cloud/ipfs/QmfFEKp9zFzTmcDjHLXi5H6E5dnKn8NjeaT5ZN2yenFfUR";
      }
  
      const signer = await provider.getSigner();
      
      console.log("Creating token with name:", name, "ticker:", ticker);
      const transaction = await factory.connect(signer).create(name, ticker, {
        value: fee,
      });
      
      console.log("Transaction hash:", transaction.hash);
      
      // Tunggu receipt dan pastikan kita mendapatkan alamat token
      console.log("Waiting for transaction confirmation...");
      const receipt = await transaction.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Cari alamat token dari event Created
      let tokenAddress = null;
      console.log("Searching for Created event in logs...");
      
      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          try {
            // Cetak log untuk debugging
            console.log("Log:", log);
            
            const parsedLog = factory.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            console.log("Parsed log:", parsedLog?.name);
            
            if (parsedLog && parsedLog.name === 'Created') {
              tokenAddress = parsedLog.args.token.toLowerCase();
              console.log("Found token address:", tokenAddress);
              break;
            }
          } catch (e) {
            // Bukan log yang kita cari, lanjutkan
            console.log("Error parsing log:", e.message);
            continue;
          }
        }
      }
      
      // Jika tidak dapat menemukan alamat token dari log, coba dapatkan dari getTokenSale
      if (!tokenAddress) {
        console.log("Token address not found in logs, trying to get from contract...");
        try {
          const totalTokens = await factory.totalTokens();
          const lastTokenIndex = totalTokens - 1;
          
          if (lastTokenIndex >= 0) {
            const tokenSale = await factory.getTokenSale(lastTokenIndex);
            tokenAddress = tokenSale.token.toLowerCase();
            console.log("Found token address from contract:", tokenAddress);
          }
        } catch (e) {
          console.error("Error getting token from contract:", e);
        }
      }
      
      // Simpan URL gambar token ke API
      await saveTokenImageUrl(imageUrl, tokenAddress);
      
      // Tambahkan URL gambar ke state dengan alamat token
      if (tokenAddress) {
        console.log("Adding token image mapping for new token:", tokenAddress, imageUrl);
        addTokenImage(tokenAddress, imageUrl);
        console.log("Token created with address:", tokenAddress, "and image URL:", imageUrl);
      } else {
        console.error("Token address not found in transaction logs");
        setUploadError("Tidak dapat menemukan alamat token dalam transaksi. Silakan refresh halaman.");
        return;
      }
  
      toggleCreate();
    } catch (error) {
      console.error("Error creating token:", error);
      setUploadError("Gagal membuat token: " + error.message);
    } finally {
      setIsUploading(false);
    }
  }

  const handleCancel = (e) => {
    e.preventDefault();
    toggleCreate();
  };

  return (
    <div className="list">
      <h2>List new token</h2>

      <div className="list_description">
        <p>Fee: {ethers.formatUnits(fee, 18)} ETH</p>
      </div>

      <form action={listHandler}>
        <input type="text" name="name" placeholder="name" required />
        <input type="text" name="ticker" placeholder="ticker" required />
        
        <div className="image-upload">
          <label htmlFor="token-image">Token Image:</label>
          <input 
            type="file" 
            id="token-image" 
            accept="image/*" 
            onChange={handleImageChange} 
          />
        </div>

        {imagePreview && (
          <div className="image-preview">
            <img 
              src={imagePreview} 
              alt="Token preview" 
            />
          </div>
        )}

        {uploadError && (
          <div className="error-message">
            {uploadError}
          </div>
        )}

        <div className="list-buttons">
          {isUploading ? (
            <div className="uploading-container">
              <Spinner />
              <p>Mengunggah gambar dan membuat token...</p>
            </div>
          ) : (
            <input 
              type="submit" 
              value="[ list ]" 
              disabled={isUploading} 
            />
          )}
          
          <button 
            type="button" 
            onClick={handleCancel} 
            className="btn--fancy" 
            disabled={isUploading}
          >
            [ cancel ]
          </button>
        </div>
      </form>
    </div>
  );
}

export default List;
