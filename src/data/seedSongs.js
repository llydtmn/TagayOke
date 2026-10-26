// Demo-mode catalog. youtubeId is null on purpose: add IDs only for videos you have verified are embeddable.
const raw = [
  ['Tadhana', 'Up Dharma Down', 'OPM'], ['Torete', 'Moonstar88', 'OPM'],
  ['Pare Ko', 'Eraserheads', 'OPM'], ['Ang Huling El Bimbo', 'Eraserheads', 'OPM'],
  ['Narda', 'Kamikazee', 'OPM'], ['Hawak Kamay', 'Yeng Constantino', 'OPM'],
  ['Mundo', 'IV of Spades', 'OPM'], ['Buwan', 'Juan Karlos', 'OPM'],
  ['Kahit Maputi Na Ang Buhok Ko', 'Rey Valera', 'OPM'], ['Bakit Ngayon Ka Lang', 'Ice Seguerra', 'OPM'],
  ['My Way', 'Frank Sinatra', 'English'], ['Bohemian Rhapsody', 'Queen', 'English'],
  ["Sweet Child o' Mine", "Guns N' Roses", 'English'], ['Careless Whisper', 'George Michael', 'English'],
  ['Dancing Queen', 'ABBA', 'English'], ['Total Eclipse of the Heart', 'Bonnie Tyler', 'English'],
  ['Shallow', 'Lady Gaga & Bradley Cooper', 'English'], ['I Will Always Love You', 'Whitney Houston', 'English'],
  ['Perfect', 'Ed Sheeran', 'English'], ['Someone Like You', 'Adele', 'English'],
];
export const SEED_SONGS = raw.map(([title, artist, language], i) => ({
  id: String(10001 + i), code: 10001 + i, title, artist, language, youtubeId: null,
}));
