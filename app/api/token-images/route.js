import { NextResponse } from 'next/server';
import { saveTokenImage, getTokenImages, getTokenImageMapping, saveTokenImageMapping } from '../token-images';

export async function GET(request) {
  // Periksa apakah ada parameter query map
  const { searchParams } = new URL(request.url);
  const map = searchParams.get('map');
  
  if (map === 'true') {
    // Jika parameter map=true, kembalikan pemetaan token
    const result = await getTokenImageMapping();
    
    if (result.success) {
      return NextResponse.json({ tokenMap: result.tokenMap });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } else {
    // Jika tidak, kembalikan daftar gambar
    const result = await getTokenImages();
    
    if (result.success) {
      return NextResponse.json({ images: result.images });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageUrl, tokenAddress } = body;
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }
    
    // Jika ada alamat token, simpan pemetaan
    if (tokenAddress) {
      await saveTokenImageMapping(tokenAddress, imageUrl);
    }
    
    // Simpan gambar ke daftar gambar
    const result = await saveTokenImage(imageUrl, tokenAddress);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 