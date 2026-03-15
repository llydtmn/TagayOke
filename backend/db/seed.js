// db/seed.js
// Migrates the exact data from your constants.js + seedData.js into MySQL.
// Run once:  node db/seed.js
// Safe to re-run — uses INSERT IGNORE so it won't duplicate rows.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

// ── Data copied from src/data/constants.js ───────────────────────────────────
const BARANGAYS = [
  'Amampacang','Ba-ay','Bante','Bantian','Binaliw','Bugtong','Caglanipao Sur',
  'Cagmanipes Norte','Cagmanipes Sur','Cagnipa','Cag-olango','Cangomaod',
  'Danao I','Danao II','Malaga','Malajog','Malayog','Malopalo','Manguino-o',
  'Marcatubig','Peña','Saljag','San Joaquin','Tinambacan Norte','Tinambacan Sur',
  'Tinaplacan','Tomaliguez','Baja','Bayo','Begaho','Cabacungan','Cabatuan',
  'Cabicahan','Cabugawan','Cag-anahaw','Cag-anibong','Cagbayang','Cagbilwang',
  'Capacuhan','Catabunan','Caybago','Dawo','De Victoria','Dinabongan','Dinagan',
  'Hugon Rosales','Jose A. Roño','Lapaan','Libertad','Limarayon','Longsob',
  'Mabini II','Macatingog','Mag-ubay','Mantaong','Manuel Barral Sr.','Mawacat',
  'Nabang','Obo-ob','Oquendo','Panlayahan','Panoypoy','Pilar','Quezon',
  'Rizal II','Roxas II','San Rufino','Sigo','Sinidman Occidental',
  'Sinidman Oriental','Talahiban','Tarabucan','Acedillo','Alibaba','Anislag',
  'Basud','Bontay','Buenavista','Cacaransan','Cagbanayacao','Cagboborac',
  'Cahumpan','Calocnayan','Canhumadac','Esperanza','Gabay','Gadgaran','Gasdo',
  'Geraga-an','Guimbaoyan Norte','Guimbaoyan Sur','Guin-on','Helino','Hibabngan',
  'Hibatang','Higasaan','Himalandrog','Jacinto','Jimautan','Kalilihan','Kilikili',
  'Langoyon','Lonoy','Looc','Maybog','Maysalong','Migara','Naga','Naguma',
  'Navarro','Nijaga','Olera','Palanas','Palanogan','Panonongan','Patong',
  'Pinamorotan','Saputan','Sinantan','Tabawan','Tanval','Tapa-e','Tigbe',
  'Victory','Villahermosa',
];

const CROP_TYPES = [
  { name: 'Rice',         emoji: '🌾' },
  { name: 'Corn',         emoji: '🌽' },
  { name: 'Coconut',      emoji: '🥥' },
  { name: 'Sugarcane',    emoji: '🎋' },
  { name: 'Banana',       emoji: '🍌' },
  { name: 'Cassava',      emoji: '🥔' },
  { name: 'Sweet Potato', emoji: '🍠' },
  { name: 'Eggplant',     emoji: '🍆' },
  { name: 'Tomato',       emoji: '🍅' },
  { name: 'Ampalaya',     emoji: '🥒' },
  { name: 'Pechay',       emoji: '🥬' },
  { name: 'Kangkong',     emoji: '🌿' },
];

// Plain-text passwords — will be hashed before insert
const SEED_USERS = [
  { id:'U001', name:'Admin CAO',      email:'admin@calbayog.gov.ph', password:'admin123',  role:'admin',   barangay: null,              avatar:'A' },
  { id:'U002', name:'Rodrigo Lim',    email:'rodrigo@farmer.ph',     password:'farmer123', role:'farmer',  barangay:'Amampacang',        avatar:'R' },
  { id:'U003', name:'Maria Santos',   email:'maria@farmer.ph',       password:'farmer123', role:'farmer',  barangay:'Nijaga',            avatar:'M' },
  { id:'U004', name:'Jose Dela Cruz', email:'jose@at.ph',            password:'at123',     role:'at',      barangay:'Bantian',           avatar:'J' },
  { id:'U005', name:'Ana Reyes',      email:'ana@encoder.ph',        password:'enc123',    role:'encoder', barangay:'Oquendo',           avatar:'A' },
];

// Mirrors seedData.js exactly
const SEED_CROPS = [
  { id:'CF-001', crop:'Rice',         barangay:'Amampacang',       farmer:'Rodrigo Lim',     farmerId:'U002', planted:'2025-01-10', expectedHarvest:'2025-04-10', status:'growing',   notes:'NSIC Rc 222 variety.' },
  { id:'CF-002', crop:'Corn',         barangay:'Nijaga',           farmer:'Maria Santos',    farmerId:'U003', planted:'2025-01-25', expectedHarvest:'2025-04-05', status:'growing',   notes:'Yellow corn for feed.' },
  { id:'CF-003', crop:'Banana',       barangay:'Tinambacan Norte', farmer:'Nestor Reyes',    farmerId:'U002', planted:'2024-10-15', expectedHarvest:'2025-03-15', status:'harvested', notes:'Lacatan variety.' },
  { id:'CF-004', crop:'Coconut',      barangay:'Caybago',          farmer:'Maria Flores',    farmerId:'U003', planted:'2022-06-01', expectedHarvest:'2025-06-01', status:'growing',   notes:'Hybrid coconut.' },
  { id:'CF-005', crop:'Tomato',       barangay:'Amampacang',       farmer:'Pedro Cruz',      farmerId:'U002', planted:'2025-02-01', expectedHarvest:'2025-04-20', status:'growing',   notes:'Drip irrigation.' },
  { id:'CF-006', crop:'Cassava',      barangay:'Malajog',          farmer:'Lourdes Bautista',farmerId:'U003', planted:'2024-08-20', expectedHarvest:'2025-02-20', status:'harvested', notes:'2 tons harvest.' },
  { id:'CF-007', crop:'Eggplant',     barangay:'Libertad',         farmer:'Danilo Ramos',    farmerId:'U004', planted:'2025-01-30', expectedHarvest:'2025-03-30', status:'growing',   notes:'Long purple variety.' },
  { id:'CF-008', crop:'Sweet Potato', barangay:'Nijaga',           farmer:'Cecilia Uy',      farmerId:'U003', planted:'2025-01-05', expectedHarvest:'2025-04-05', status:'growing',   notes:'Orange flesh.' },
  { id:'CF-009', crop:'Rice',         barangay:'Bantian',          farmer:'Carlos Mendoza',  farmerId:'U004', planted:'2025-02-10', expectedHarvest:'2025-05-10', status:'growing',   notes:'Irrigated field.' },
  { id:'CF-010', crop:'Corn',         barangay:'Malaga',           farmer:'Julio Navarro',   farmerId:'U005', planted:'2025-01-18', expectedHarvest:'2025-04-18', status:'growing',   notes:'Hybrid corn.' },
  { id:'CF-011', crop:'Banana',       barangay:'Malayog',          farmer:'Felipe Torres',   farmerId:'U004', planted:'2024-11-01', expectedHarvest:'2025-04-01', status:'growing',   notes:'Cardava variety.' },
  { id:'CF-012', crop:'Coconut',      barangay:'Panlayahan',       farmer:'Jose Dela Cruz',  farmerId:'U004', planted:'2021-07-15', expectedHarvest:'2025-07-15', status:'growing',   notes:'Intercropped with corn.' },
  { id:'CF-013', crop:'Pechay',       barangay:'San Joaquin',      farmer:'Ana Bautista',    farmerId:'U005', planted:'2025-02-15', expectedHarvest:'2025-03-10', status:'growing',   notes:'Fast harvest.' },
  { id:'CF-014', crop:'Kangkong',     barangay:'Rizal II',         farmer:'Mario Tan',       farmerId:'U005', planted:'2025-02-20', expectedHarvest:'2025-03-15', status:'growing',   notes:'Riverbank farm.' },
  { id:'CF-015', crop:'Tomato',       barangay:'Roxas II',         farmer:'Ricardo Ong',     farmerId:'U002', planted:'2025-01-28', expectedHarvest:'2025-04-28', status:'growing',   notes:'High yield seeds.' },
  { id:'CF-016', crop:'Rice',         barangay:'Oquendo',          farmer:'Ramon Valdez',    farmerId:'U005', planted:'2025-01-12', expectedHarvest:'2025-04-12', status:'growing',   notes:'Lowland rice.' },
  { id:'CF-017', crop:'Corn',         barangay:'Malopalo',         farmer:'Pedro Velasco',   farmerId:'U003', planted:'2025-01-20', expectedHarvest:'2025-04-20', status:'growing',   notes:'Dry season crop.' },
  { id:'CF-018', crop:'Cassava',      barangay:'Cagnipa',          farmer:'Antonio Uy',      farmerId:'U004', planted:'2024-09-10', expectedHarvest:'2025-03-10', status:'growing',   notes:'Large root harvest.' },
  { id:'CF-019', crop:'Eggplant',     barangay:'Cabicahan',        farmer:'Felisa Cruz',     farmerId:'U005', planted:'2025-01-29', expectedHarvest:'2025-04-01', status:'growing',   notes:'Organic fertilizer.' },
  { id:'CF-020', crop:'Ampalaya',     barangay:'Quezon',           farmer:'Ruben Reyes',     farmerId:'U002', planted:'2025-02-05', expectedHarvest:'2025-04-05', status:'growing',   notes:'Trellis supported.' },
  { id:'CF-021', crop:'Rice',         barangay:'Amampacang',       farmer:'Nena Lim',        farmerId:'U002', planted:'2025-02-01', expectedHarvest:'2025-05-01', status:'growing',   notes:'' },
  { id:'CF-022', crop:'Pechay',       barangay:'Bantian',          farmer:'Carla Mendoza',   farmerId:'U004', planted:'2025-02-18', expectedHarvest:'2025-03-18', status:'growing',   notes:'' },
  { id:'CF-023', crop:'Kangkong',     barangay:'Malaga',           farmer:'Edwin Navarro',   farmerId:'U005', planted:'2025-02-22', expectedHarvest:'2025-03-22', status:'growing',   notes:'' },
  { id:'CF-024', crop:'Corn',         barangay:'Amampacang',       farmer:'Bobby Lim',       farmerId:'U002', planted:'2025-01-15', expectedHarvest:'2025-04-15', status:'harvested', notes:'Good harvest.' },
  { id:'CF-025', crop:'Banana',       barangay:'Oquendo',          farmer:'Ligaya Valdez',   farmerId:'U005', planted:'2024-12-01', expectedHarvest:'2025-05-01', status:'growing',   notes:'' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function getId(pool, table, nameCol, nameVal) {
  const [rows] = await pool.query(
    `SELECT id FROM ${table} WHERE ${nameCol} = ? LIMIT 1`, [nameVal]
  );
  if (!rows.length) throw new Error(`${table}: "${nameVal}" not found`);
  return rows[0].id;
}

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Barangays
    console.log('  Seeding barangays…');
    for (const name of BARANGAYS) {
      await conn.query('INSERT IGNORE INTO barangays (name) VALUES (?)', [name]);
    }

    // 2. Crop types
    console.log('  Seeding crop types…');
    for (const { name, emoji } of CROP_TYPES) {
      await conn.query(
        'INSERT IGNORE INTO crop_types (name, emoji) VALUES (?, ?)',
        [name, emoji]
      );
    }

    // 3. Users (hash passwords)
    console.log('  Seeding users…');
    for (const u of SEED_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      let barangayId = null;
      if (u.barangay) {
        const [rows] = await conn.query(
          'SELECT id FROM barangays WHERE name = ? LIMIT 1', [u.barangay]
        );
        barangayId = rows[0]?.id ?? null;
      }
      await conn.query(
        `INSERT IGNORE INTO users (id, name, email, password, role, barangay_id, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.name, u.email, hash, u.role, barangayId, u.avatar]
      );
    }

    // 4. Crop entries
    console.log('  Seeding crop entries…');
    for (const c of SEED_CROPS) {
      const [cropRows] = await conn.query(
        'SELECT id FROM crop_types WHERE name = ? LIMIT 1', [c.crop]
      );
      const [bgyRows] = await conn.query(
        'SELECT id FROM barangays WHERE name = ? LIMIT 1', [c.barangay]
      );
      if (!cropRows.length) { console.warn(`  ⚠ crop type not found: ${c.crop}`); continue; }
      if (!bgyRows.length)  { console.warn(`  ⚠ barangay not found: ${c.barangay}`); continue; }

      await conn.query(
        `INSERT IGNORE INTO crop_entries
           (id, crop_type_id, barangay_id, farmer_name, farmer_id,
            planted, expected_harvest, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          cropRows[0].id,
          bgyRows[0].id,
          c.farmer,
          c.farmerId,
          c.planted,
          c.expectedHarvest,
          c.status,
          c.notes || null,
        ]
      );
    }

    await conn.commit();
    console.log('\n✅  Seed complete!');
  } catch (err) {
    await conn.rollback();
    console.error('❌  Seed failed:', err.message);
  } finally {
    conn.release();
    pool.end();
  }
}

seed();