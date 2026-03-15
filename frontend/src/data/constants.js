export const BARANGAYS = ['Amampacang','Ba-ay','Bante','Bantian','Binaliw','Bugtong','Caglanipao Sur','Cagmanipes Norte','Cagmanipes Sur','Cagnipa','Cag-olango','Cangomaod','Danao I','Danao II','Malaga','Malajog','Malayog','Malopalo','Manguino-o','Marcatubig','Peña','Saljag','San Joaquin','Tinambacan Norte','Tinambacan Sur','Tinaplacan','Tomaliguez','Baja','Bayo','Begaho','Cabacungan','Cabatuan','Cabicahan','Cabugawan','Cag-anahaw','Cag-anibong','Cagbayang','Cagbilwang','Capacuhan','Catabunan','Caybago','Dawo','De Victoria','Dinabongan','Dinagan','Hugon Rosales','Jose A. Roño','Lapaan','Libertad','Limarayon','Longsob','Mabini II','Macatingog','Mag-ubay','Mantaong','Manuel Barral Sr.','Mawacat','Nabang','Obo-ob','Oquendo','Panlayahan','Panoypoy','Pilar','Quezon','Rizal II','Roxas II','San Rufino','Sigo','Sinidman Occidental','Sinidman Oriental','Talahiban','Tarabucan','Acedillo','Alibaba','Anislag','Basud','Bontay','Buenavista','Cacaransan','Cagbanayacao','Cagboborac','Cahumpan','Calocnayan','Canhumadac','Esperanza','Gabay','Gadgaran','Gasdo','Geraga-an','Guimbaoyan Norte','Guimbaoyan Sur','Guin-on','Helino','Hibabngan','Hibatang','Higasaan','Himalandrog','Jacinto','Jimautan','Kalilihan','Kilikili','Langoyon','Lonoy','Looc','Maybog','Maysalong','Migara','Naga','Naguma','Navarro','Nijaga','Olera','Palanas','Palanogan','Panonongan','Patong','Pinamorotan','Saputan','Sinantan','Tabawan','Tanval','Tapa-e','Tigbe','Victory','Villahermosa'];

export const CROPS = ['Rice','Corn','Coconut','Sugarcane','Banana','Cassava','Sweet Potato','Eggplant','Tomato','Ampalaya','Pechay','Kangkong'];

export const CROP_EMOJI = {
  'Rice':'🌾','Corn':'🌽','Coconut':'🥥','Sugarcane':'🎋','Banana':'🍌',
  'Cassava':'🥔','Sweet Potato':'🍠','Eggplant':'🍆','Tomato':'🍅',
  'Ampalaya':'🥒','Pechay':'🥬','Kangkong':'🌿'
};

export const ROLE_LABELS = {
  admin: 'Admin (CAO)',
  farmer: 'Farmer',
  at: 'Agricultural Technologist',
  encoder: 'Barangay Encoder',
};

export const SEED_USERS = [
  { id:'U001', name:'Admin CAO',      email:'admin@calbayog.gov.ph', password:'admin123',  role:'admin',   barangay: null,         avatar:'A' },
  { id:'U002', name:'Rodrigo Lim',    email:'rodrigo@farmer.ph',     password:'farmer123', role:'farmer',  barangay:'Amampacang',  avatar:'R' },
  { id:'U003', name:'Maria Santos',   email:'maria@farmer.ph',       password:'farmer123', role:'farmer',  barangay:'Nijaga',      avatar:'M' },
  { id:'U004', name:'Jose Dela Cruz', email:'jose@at.ph',            password:'at123',     role:'at',      barangay:'Bantian',     avatar:'J' },
  { id:'U005', name:'Ana Reyes',      email:'ana@encoder.ph',        password:'enc123',    role:'encoder', barangay:'Oquendo',     avatar:'A' },
];
