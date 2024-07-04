export const generateAnkiCompatibleGUID = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[\\]^_`{|}~";
  let guid = "";
  for (let i = 0; i < 10; i++) {
    guid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return guid;
};

export default generateAnkiCompatibleGUID;
