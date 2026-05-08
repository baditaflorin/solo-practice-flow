export const encryptTextWithPassphrase = async (plainText: string, passphrase: string) => {
  const age = await import('age-encryption')
  const encrypter = new age.Encrypter()
  encrypter.setPassphrase(passphrase)
  const cipherText = await encrypter.encrypt(plainText)
  return age.armor.encode(cipherText)
}

export const decryptTextWithPassphrase = async (armoredText: string, passphrase: string) => {
  const age = await import('age-encryption')
  const decrypter = new age.Decrypter()
  decrypter.addPassphrase(passphrase)
  const decoded = age.armor.decode(armoredText)
  const plainText = await decrypter.decrypt(decoded, 'text')
  return String(plainText)
}
