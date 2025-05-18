import fs from 'fs';
import path from 'path';

// Konstanta untuk path file pemetaan token
const TOKEN_MAP_FILE = path.join(process.cwd(), 'app', 'token-image-map.json');

// Fungsi untuk memastikan file pemetaan token ada
function ensureTokenMapFile() {
  if (!fs.existsSync(TOKEN_MAP_FILE)) {
    fs.writeFileSync(TOKEN_MAP_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

export async function saveTokenImage(imageUrl, tokenAddress = null) {
  try {
    // Baca file images.json
    const filePath = path.join(process.cwd(), 'app', 'images.json');
    const imagesData = fs.readFileSync(filePath, 'utf8');
    
    // Parse JSON menjadi array
    const images = JSON.parse(imagesData);
    
    // Tambahkan URL gambar baru ke awal array
    images.unshift(imageUrl);
    
    // Tulis kembali file images.json
    fs.writeFileSync(filePath, JSON.stringify(images, null, 2), 'utf8');
    
    // Jika ada alamat token, simpan pemetaan
    if (tokenAddress) {
      await saveTokenImageMapping(tokenAddress, imageUrl);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving token image:', error);
    return { success: false, error: error.message };
  }
}

export async function getTokenImages() {
  try {
    // Baca file images.json
    const filePath = path.join(process.cwd(), 'app', 'images.json');
    const imagesData = fs.readFileSync(filePath, 'utf8');
    
    // Parse JSON menjadi array
    const images = JSON.parse(imagesData);
    
    return { success: true, images };
  } catch (error) {
    console.error('Error getting token images:', error);
    return { success: false, error: error.message };
  }
}

export async function saveTokenImageMapping(tokenAddress, imageUrl) {
  try {
    ensureTokenMapFile();
    
    // Normalisasi alamat token
    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Baca file pemetaan token
    let tokenMap = {};
    if (fs.existsSync(TOKEN_MAP_FILE)) {
      const mapData = fs.readFileSync(TOKEN_MAP_FILE, 'utf8');
      tokenMap = JSON.parse(mapData);
    }
    
    // Tambahkan atau perbarui pemetaan
    tokenMap[normalizedAddress] = imageUrl;
    
    // Tulis kembali file pemetaan token
    fs.writeFileSync(TOKEN_MAP_FILE, JSON.stringify(tokenMap, null, 2), 'utf8');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving token image mapping:', error);
    return { success: false, error: error.message };
  }
}

export async function getTokenImageMapping() {
  try {
    ensureTokenMapFile();
    
    // Baca file pemetaan token
    const mapData = fs.readFileSync(TOKEN_MAP_FILE, 'utf8');
    const tokenMap = JSON.parse(mapData);
    
    return { success: true, tokenMap };
  } catch (error) {
    console.error('Error getting token image mapping:', error);
    return { success: false, error: error.message };
  }
} 