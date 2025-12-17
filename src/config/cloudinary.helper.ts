 
export async function uploadToCloudinary(
  file: File,
  {
    cloudName,
    apiKey,
    uploadPreset,
    folder = 'events',
    sign = false,
    apiSecret,
  }: {
    cloudName: string;
    apiKey: string;
    uploadPreset?: string;
    folder?: string;
    sign?: boolean;
    apiSecret?: string;
  },
): Promise<string> {
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const form = new FormData();
  form.set('file', file);
  form.set('folder', folder);

  if (sign) {
    if (!apiSecret) {
      throw new Error('API Secret is required for signed uploads');
    }
    
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const digest = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(toSign),
    );
    const signature = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    form.set('api_key', apiKey);
    form.set('timestamp', timestamp);
    form.set('signature', signature);
  } else {
    if (!uploadPreset) {
      throw new Error('Upload preset is required for unsigned uploads');
    }
    form.set('upload_preset', uploadPreset);
  }

  try {
    const res = await fetch(endpoint, { method: 'POST', body: form });
    
    // Get response text for better error debugging
    const responseText = await res.text();
    
    if (!res.ok) {
      console.error('Cloudinary upload failed:', {
        status: res.status,
        statusText: res.statusText,
        response: responseText,
        cloudName,
        uploadPreset,
        folder,
        sign
      });
      throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText} - ${responseText}`);
    }
    
    const json = JSON.parse(responseText) as { secure_url: string };
    return json.secure_url;
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw error;
  }
}

export async function deleteImageFromCloudinary(
  publicId: string,
  {
    cloudName,
    apiKey,
    apiSecret,
  }: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  },
): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const digest = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(toSign),
  );
  const signature = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const form = new FormData();
  form.set('public_id', publicId);
  form.set('timestamp', timestamp);
  form.set('api_key', apiKey);
  form.set('signature', signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Failed to delete image:', {
        status: res.status,
        statusText: res.statusText,
        response: errorText,
        publicId
      });
    }
  } catch (error) {
    console.error('Error in deleteImageFromCloudinary:', error);
  }
}

 
export const extractPublicIdFromUrl = (url: string): string => {
  try {
     
    const patterns = [
      /\/v\d+\/(.+)\./,           
      /\/upload\/(.+)\./,         
      /\/image\/upload\/(.+)\./,   
    ];
    
    for (const pattern of patterns) {
      const matches = url.match(pattern);
      if (matches) {
        return matches[1];
      }
    }
    
    console.error('Could not extract public ID from URL:', url);
    return '';
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return '';
  }
};