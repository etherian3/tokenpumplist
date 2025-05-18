import axios from 'axios';
import { pinataConfig } from '../pinata.config';

// Fungsi untuk mengunggah gambar ke IPFS melalui Pinata
export const uploadImageToPinata = async (file) => {
  try {
    if (!file) {
      throw new Error('File tidak ditemukan');
    }

    const formData = new FormData();
    formData.append('file', file);

    const options = {
      pinataMetadata: {
        name: `Token-Image-${Date.now()}`,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };

    formData.append('pinataMetadata', JSON.stringify(options.pinataMetadata));
    formData.append('pinataOptions', JSON.stringify(options.pinataOptions));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data;`,
          pinata_api_key: pinataConfig.apiKey,
          pinata_secret_api_key: pinataConfig.apiSecret,
          // Alternatif menggunakan JWT
          // Authorization: `Bearer ${pinataConfig.jwt}`,
        },
      }
    );

    if (response.status === 200) {
      return `${pinataConfig.gateway}${response.data.IpfsHash}`;
    }

    throw new Error('Gagal mengunggah gambar ke IPFS');
  } catch (error) {
    console.error('Error mengunggah ke IPFS:', error);
    throw error;
  }
}; 