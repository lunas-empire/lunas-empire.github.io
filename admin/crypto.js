const encoder=new TextEncoder();

export function decodeBase64(value) {
  return Uint8Array.from(atob(value),character=>character.charCodeAt(0));
}

export async function deriveAdminKey(password,manifest,cryptoApi=globalThis.crypto) {
  if (!cryptoApi?.subtle || manifest.version!==1 || manifest.kdf?.name!=='PBKDF2' || manifest.kdf.hash!=='SHA-256' || manifest.kdf.iterations!==600000) {
    throw new Error('Unsupported encrypted package.');
  }
  const material=await cryptoApi.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  return cryptoApi.subtle.deriveKey(
    {name:'PBKDF2',salt:decodeBase64(manifest.kdf.salt),iterations:manifest.kdf.iterations,hash:manifest.kdf.hash},
    material,
    {name:'AES-GCM',length:256},
    false,
    ['decrypt'],
  );
}

export function decryptAdminBytes(ciphertext,entry,key,cryptoApi=globalThis.crypto) {
  return cryptoApi.subtle.decrypt(
    {name:'AES-GCM',iv:decodeBase64(entry.iv),additionalData:encoder.encode(entry.aad),tagLength:128},
    key,
    ciphertext,
  );
}
