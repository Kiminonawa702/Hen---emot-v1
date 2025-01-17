// File: index.js

// Import library yang dibutuhkan
process.on('uncaughtException', console.error); // Menangani kesalahan yang tidak tertangkap
const {
  default: WAConnect, // Library untuk koneksi WhatsApp
  useMultiFileAuthState, // Mengelola file sesi
  DisconnectReason, // Kode alasan pemutusan koneksi
  fetchLatestBaileysVersion, // Mendapatkan versi terbaru Baileys
  makeInMemoryStore, // Membuat penyimpanan data dalam memori
  Browsers, // Menentukan browser yang digunakan
  fetchLatestWaWebVersion // Mendapatkan versi terbaru WhatsApp Web
} = require("@whiskeysockets/baileys"); 
const pino = require("pino"); // Library untuk logging
const readline = require('readline'); // Library untuk input dan output baris perintah
const { Boom } = require("@hapi/boom"); // Library untuk menangani error
const fs = require('fs'); // Library untuk mengakses file system

// Menentukan apakah menggunakan kode pairing
const pairingCode = process.argv.includes("--pairing-code");

// Membuat objek readline untuk input dan output baris perintah
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Fungsi untuk membuat pertanyaan di baris perintah
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// Membuat penyimpanan data dalam memori
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

// Fungsi utama untuk menjalankan bot WhatsApp
async function WAStart() {
  // Memuat file sesi dan fungsi penyimpanan
  const { state, saveCreds } = await useMultiFileAuthState("./sesi");

  // Mendapatkan versi terbaru WhatsApp Web
  const { version, isLatest } = await fetchLatestWaWebVersion().catch(() => fetchLatestBaileysVersion());
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  // Membuat koneksi WhatsApp
  const client = WAConnect({
    logger: pino({ level: "silent" }), // Menonaktifkan logging
    printQRInTerminal: false, // Menonaktifkan tampilan QR Code di terminal
    browser: Browsers.ubuntu("Chrome"), // Menentukan browser sebagai Chrome di Ubuntu
    auth: state, // Menggunakan file sesi yang dimuat sebelumnya
  });

  // Mengikat penyimpanan data ke event client
  store.bind(client.ev);

  // Meminta nomor WhatsApp jika akun belum terdaftar
  if (!client.authState.creds.registered) { 
    const phoneNumber = await question(`Silahkan masukin nomor Whatsapp kamu: `); // Meminta nomor WhatsApp dari pengguna
    let code = await client.requestPairingCode(phoneNumber); // Meminta kode pairing
    code = code?.match(/.{1,4}/g)?.join("-") || code; // Memformat kode pairing
    console.log(`⚠︎ Kode Whatsapp kamu : ` + code) // Menampilkan kode pairing
  }

  // Event handler untuk pembaruan pesan
  client.ev.on("messages.upsert", async (chatUpdate) => {
    //console.log(JSON.stringify(chatUpdate, undefined, 2)) // Menampilkan informasi pembaruan pesan (bisa dihapus)
    try {
      // Mengambil pesan terbaru
      const m = chatUpdate.messages[0];

      // Jika pesan tidak memiliki konten, keluar dari event handler
      if (!m.message) return;

      // Menentukan waktu maksimum untuk merespon status
      const maxTime = 5 * 60 * 1000; // 5 menit

      // Mengecek jika pesan berasal dari status broadcast dan bukan dari diri sendiri
      if (m.key && !m.key.fromMe && m.key.remoteJid === 'status@broadcast') {
        // Jika pesan bukan reaksi, lanjutkan
        if (!m.message.reactionMessage) {
          // Menentukan pengirim yang diizinkan untuk direaksi
          const allowedSenders = [
            "6281447345627@s.whatsapp.net",
            "628145563553@s.whatsapp.net",
          ];

          // Jika pengirim tidak diizinkan, lanjutkan
          if (!allowedSenders.includes(m.key.participant)) {
            // Mendapatkan waktu saat ini dan waktu pesan
            const currentTime = Date.now();
            const messageTime = m.messageTimestamp * 1000;
            const timeDiff = currentTime - messageTime;

            // Jika selisih waktu kurang dari waktu maksimum, lanjutkan
            if (timeDiff <= maxTime) {
              // Daftar emoji yang digunakan
              const emojis = [
    // Smiley Orang
    "😊", "🥶", "🗿", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🙂", "🙃", "😉", "😇", 
    "😈", "👿", "💀", "👻", "👽", "🤖", "💩", "😺", "😸", "😹", "😻", "😼", 
    "😽", "🙀", "😿", "😾", "😔", "😮", "🥺", "🧐", "🤨", "🙄", "🤫", "🤭",
    "🤑", "🤪", "🤯", "🤠", "🤡", "🎅", "🦸", "🦹", "🧙", "🧝", "🧛", "🧜",
    "👼", "🤰", "👨‍👩‍👧‍👦", "👫", "🤝", "✊", "✌️", "🤞", "👍", "👎", "🙏",
    "🤝", "👋", "🚶", "🏃", "💃", "🕺", "🕴️", "🤸", "🧘", "🏄", "🚣", "🏊",
    "🚴", "🚵", "🏎️", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", "🚜", "🚲", "🛵", 
    "✈️", "🚁", "🚀", "🛰️", "🛳️", "🚢", "⚓", "😔", "😮", "🥺", "🧐", "🤨", 
    "🙄", "🤫", "🤭", "🤑", "🤪", "🤯", "🤠", "🤡", "🎅", "🦸", "🦹", "🧙", 
    "🧝", "🧛", "🧜", "👼", "🤰", "👨‍👩‍👧‍👦", "👫", "🤝", "✊", "✌️", "🤞", 
    "👍", "👎", "🙏", "🤝", "👋", "🚶", "🏃", "💃", "🕺", "🕴️", "🤸", "🧘", 
    "🏄", "🚣", "🏊", "🚴", "🚵", "🏎️", "🚓", "🚑", "🚒", "🚐", "🚚", "🚛", 
    "🚜", "🚲", "🛵", "✈️", "🚁", "🚀", "🛰️", "🛳️", "🚢", "⚓",

    // Hewan & Alam
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐺", 
    "🐴", "🦄", "🐮", "🐷", "🐸", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🐠", 
    "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐦", "🐧", "🕊️", "🦅", "🦉", "🦇", 
    "🐔", "🦃", "🦆", "🦅", "🦉", "🦇", "🐛", "🐌", "🦋", "🐝", "🐜", "🐞", 
    "🕷️", "🕸️", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🍁", "🍂", "🍄", "💐", 
    "🌻", "🌹", "🌷", "🌺", "🌸", "🌼", "🌎", "🌍", "🌏", "🌕", "🌖", "🌗", 
    "🌘", "🌑", "🌒", "🌓", "🌔", "☀️", "🌤️", "⛅️", "🌥️", "🌦️", "🌧️", 
    "⛈️", "🌩️", "🌨️", "❄️", "⛄️", "💧", "💦", "🌊", "🌋", "⛰️", "🏔️", 
    "🗻", "🏕️", "⛺️", "🏞️", "🦍", "🐘", "🦒", "🦓", "🦌", "🐇", "🐿️", "🦔", 
    "🦇", "🦅", "🦉", "🦜", "🦩", "🦚", "🐢", "🦎", "🐍", "🐛", "🐜", "🐝", 
    "🐞", "🕷️", "🕸️", "🦂", "🦀", "🦞", "🦐", "🦑", "🐙", "🐠", "🐟", "🐬", 
    "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🐈", "🐕", "🐩", "🐎", "🐄", "🐖", 
    "🐏", "🐐", "🐑", "🦙", "🦘", "🦥", "🐼", "🐨", "🐻", "🦊", "🐺", "🦝", 
    "🦨", "🦡", "🦦", "🐇", "🐿️", "🦔", "🦇", "🦅", "🦉", "🦜", "🦩", "🦚", 
    "🐦", "🐧", "🕊️", "🦃", "🐔", "🐤", "🐥", "🦆", "🦅", "🦉", "🦇", "🐛", 
    "🐌", "🦋", "🐝", "🐜", "🐞", "🕷️", "🕸️", "🦂", "🦀", "🦞", "🦐", "🦑", 
    "🐙", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐢", "🦎", "🐍", "🐲", 
    "🐉", "🦕", "🦖", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", 
    "🍁", "🍂", "🍄", "💐", "🌻", "🌹", "🌷", "🌺", "🌸", "🌼", "🌎", "🌍", 
    "🌏", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "☀️", "🌤️", 
    "⛅️", "🌥️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "⛄️", "💧", "💦", 
    "🌊", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺️", "🏞️", "🦍", "🐘", "🦒", "🦓", 
    "🦌", "🐇", "🐿️", "🦔", "🦇", "🦅", "🦉", "🦜", "🦩", "🦚", "🐢", "🦎", 
    "🐍", "🐛", "🐜", "🐝", "🐞", "🕷️", "🕸️", "🦂", "🦀", "🦞", "🦐", "🦑", 
    "🐙", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🐈", "🐕", 
    "🐩", "🐎", "🐄", "🐖", "🐏", "🐐", "🐑", "🦙", "🦘", "🦥", "🐼", "🐨", 
    "🐻", "🦊", "🐺", "🦝", "🦨", "🦡", "🦦", "🐇", "🐿️", "🦔", "🦇", "🦅", 
    "🦉", "🦜", "🦩", "🦚", "🐦", "🐧", "🕊️", "🦃", "🐔", "🐤", "🐥", "🦆", 
    "🦅", "🦉", "🦇", "🐛", "🐌", "🦋", "🐝", "🐜", "🐞", "🕷️", "🕸️", "🦂", 
    "🦀", "🦞", "🦐", "🦑", "🐙", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", 
    "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🌱", "🌲", "🌳", "🌴", "🌵", 
    "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍄", "💐", "🌻", "🌹", "🌷", "🌺", 
    "🌸", "🌼", "🌎", "🌍", "🌏", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", 
    "🌔", "☀️", "🌤️", "⛅️", "🌥️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", 
    "⛄️", "💧", "💦", "🌊", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺️", "🏞️", 

    // Makanan & Minuman
    "🍎", "🍏", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍒", "🍑", "🍍", 
    "🥭", "🥑", "🥕", "🍆", "🍅", "🥔", "🧅", "🍄", "🌶️", "🥒", "🥦", "🥬", 
    "🥑", "🍕", "🍔", "🍟", "🌭", "🌮", "🥪", "🍦", "🍧", "🍨", "🍩", "🍪", 
    "🍫", "🍬", "🍭", "🍿", "🥂", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🍇", "🍈", 
    "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐", "🍒", "🍓", "🍑", 
    "🥝", "🥑", "🍆", "🍅", "🥔", "🥕", "🧅", "🌶️", "🥒", "🥦", "🥬", "🍄", 
    "🥜", "🌰", "🍞", "🥐", "🥖", "🥨", "🧀", "🥚", "🥓", "🥩", "🍗", "🍖", 
    "🌭", "🍔", "🍟", "🍕", "🌮", "🥪", "🍿", "🍩", "🍪", "🎂", "🍰", "🧁", 
    "🥧", "🍫", "🍬", "🍭", "🍦", "🍧", "🍨", "🥂", "🍾", "🍷", "🍸", "🍹", 
    "🍺", "🍻", "🥤", "☕", "🍵", "🍶", "🍾", "🥛", "🍼", "🍽️", "🍴", "🥄", 
    "🔪", "🧂", "🌶️", "🍯", "🧂", "🌶️", "🍯",

    // Aktivitas
    "⚽", "🏀", "🏈", "⚾️", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🏒", "🏑", 
    "🏏", "⛳️", "🏹", "🎣", "🥊", "🥋", "🏋️", "🚴", "🏊", "🏄", "⛷️", 
    "🏂", "🪂", "🧗", "🎮", "🕹️", "🎲", "🎯", "🎼", "🚶", "🏃", "💃", "🕺", 
    "🕴️", "🤸", "🧘", "🏄", "🚣", "🏊", "🚴", "🚵", "🏎️", "🚓", "🚑", "🚒", 
    "🚐", "🚚", "🚛", "🚜", "🚲", "🛵", "✈️", "🚁", "🚀", "🛰️", "🛳️", "🚢", 
    "⚓", "🏹", "🎣", "🥊", "🥋", "🏋️", "🚴", "🏊", "🏄", "⛷️", "🏂", "🪂", 
    "🧗", "🎮", "🕹️", "🎲", "🎯", "🎼", "🎤", "🎧", "🎺", "🎷", "🎸", "🎻", 
    "🎹", "🥁", "🎨", "🎭", "🎬", "🎥", "📸", "🖼️", "📚", "📖", "✍️", "✏️", 
    "✂️", "📌", "📎", "📏", "📐", "🗃️", "🗄️", "🗑️", "🧰", "🔨", "🔧", "🔩", 
    "🧲", "💡", "🔦", "🕯️", "🔌", "🔋", "💻", "🖥️", "📱", "☎️", "📡", "🖨️", 
    "⌨️", "🖱️", "🌐", "🗺️", "🧭", "⏰", "⌚️", "⏳", "⏱️", "🧮", "💰", "💵", 
    "💶", "💷", "💳", "💎", "💍", "👑", "🎒", "💼", "👜", "👝", "👛", "👓", 
    "🕶️", "👔", "👕", "👖", "👗", "👠", "👞", "👟", "🥾", "🧦", "🧤", "🧣", 
    "🎩", "🧢", "👒", "🌂", "☂️", "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", 
    "🐼", "🐨", "🐯", "🦁", "🐺", "🐴", "🦄", "🐮", "🐷", "🐸", "🐢", "🐍", 
    "🦎", "🦖", "🦕", "🐙", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐦", 
    "🐧", "🕊️", "🦅", "🦉", "🦇", "🐔", "🦃", "🦆", "🦅", "🦉", "🦇", "🐛", 
    "🐌", "🦋", "🐝", "🐜", "🐞", "🕷️", "🕸️", "🦂", "🦀", "🦞", "🦐", "🦑", 
    "🐙", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐢", "🦎", "🐍", "🐲", 
    "🐉", "🦕", "🦖", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", 
    "🍁", "🍂", "🍄", "💐", "🌻", "🌹", "🌷", "🌺", "🌸", "🌼", "🌎", "🌍", 
    "🌏", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "☀️", "🌤️", 
    "⛅️", "🌥️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "⛄️", "💧", "💦", 
    "🌊", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺️", "🏞️", "🏖️", "🏝️", "🏜️", 
    "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺️", "🏞️",

    // Perjalanan & Tempat
    "✈️", "🚆", "🚇", "🚌", "🚗", "🚕", "🚲", "🛵", "🛳️", "🚀", "🚁", "🛸", 
    "🏠", "🏢", "🏫", "🏥", "🏦", "🏪", "🏛️", "⛪️", "🛕", "⛩️", "🕋", "🕍", 
    "🏞️", "🏖️", "🏝️", "⛰️", "🏔️", "🌋", "🏕️", "⛺️", "✈️", "🚆", "🚇", 
    "🚌", "🚗", "🚕", "🚲", "🛵", "🛳️", "🚀", "🚁", "🛸", "🏠", "🏢", "🏫", 
    "🏥", "🏦", "🏪", "🏛️", "⛪️", "🛕", "⛩️", "🕋", "🕍", "🏞️", "🏖️", "🏝️", 
    "⛰️", "🏔️", "🌋", "🏕️", "⛺️", "🏞️",

    // Objek
    "📱", "💻", "🖥️", "🖨️", "📸", "🎥", "🎧", "🎤", "🎨", "📚", "✏️", 
    "✂️", "🗝️", "🔐", "⌚️", "💍", "💎", "💰", "💵", "💳", "📱", "💻", "🖥️", 
    "🖨️", "📸", "🎥", "🎧", "🎤", "🎨", "📚", "✏️", "✂️", "🗝️", "🔐", "⌚️", 
    "💍", "💎", "💰", "💵", "💳",

    // Simbol
    "⭐", "🌟", "💫", "✨", "⚡️", "🔥", "💧", "💨", "🌈", "☁️", "☀️", 
    "🌕", "🌑", "⭐", "🌟", "💫", "✨", "⚡️", "🔥", "💧", "💨", "🌈", 
    "☁️", "☀️", "🌕", "🌑", "💯", "🔢", "🆚", "➕", "➖", "✖️", "➗", "💲", 
    "💰", "💳", "💎", "💍", "👑", "🏆", "🥇", "🥈", "🥉", "🏅", "🎗️", "🎁", 
    "🎀", "🎈", "🎉", "🎊", "🎆", "🎇", "🧨", "✨", "💫", "⭐️", "🌟", "💫", 
    "✨", "⚡️", "🔥", "💧", "💨", "🌈", "☁️", "☀️", "🌕", "🌑", "☔️", "☂️", 
    "🌂", "❄️", "⛄️", "💧", "💦", "🌊", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺️", 
    "🏞️", "🏖️", "🏝️", "🏜️", "🌋", "⛰️", "🏔️", "🗻", "🏕️", "⛺️", "🏞️", 

    // Bendera
   "🏁", "🚩", "🎌", "🏴", "🏳️", "🏴‍☠️", "🇦🇩", "🇦🇪", "🇦🇫", "🇦🇬", "🇦🇮", "🇦🇱", "🇦🇲", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇦🇹", "🇦🇺", "🇦🇼", "🇦🇽", "🇦🇿", "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪", "🇧🇫", "🇧🇬", "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇲", "🇧🇳", "🇧🇴", "🇧🇷", "🇧🇸", "🇧🇹", "🇧🇼", "🇧🇾", "🇧🇿", "🇨🇦", "🇨🇨", "🇨🇩", "🇨🇫", "🇨🇬", "🇨🇭", "🇨🇮", "🇨🇰", "🇨🇱", "🇨🇲", "🇨🇳", "🇨🇴", "🇨🇷", "🇨🇺", "🇨🇻", "🇨🇼", "🇨🇽", "🇨🇾", "🇨🇿", "🇩🇪", "🇩🇯", "🇩🇰", "🇩🇲", "🇩🇴", "🇩🇿", "🇪🇨", "🇪🇪", "🇪🇬", "🇪🇷", "🇪🇸", "🇪🇹", "🇪🇺", "🇫🇮", "🇫🇯", "🇫🇲", "🇫🇴", "🇫🇷", "🇬🇦", "🇬🇧", "🇬🇩", "🇬🇪", "🇬🇬", "🇬🇭", "🇬🇮", "🇬🇱", "🇬🇲", "🇬🇳", "🇬🇶", "🇬🇷", "🇬🇹", "🇬🇺", "🇬🇼", "🇬🇾", "🇭🇰", "🇭🇳", "🇭🇷", "🇭🇹", "🇭🇺", "🇮🇨", "🇮🇩", "🇮🇪", "🇮🇱", "🇮🇲", "🇮🇳", "🇮🇴", "🇮🇶", "🇮🇷", "🇮🇸", "🇮🇹", "🇯🇪", "🇯🇲", "🇯🇴", "🇯🇵", "🇰🇪", "🇰🇬", "🇰🇭", "🇰🇮", "🇰🇲", "🇰🇳", "🇰🇵", "🇰🇷", "🇰🇼", "🇰🇾", "🇰🇿", "🇱🇦", "🇱🇧", "🇱🇨", "🇱🇮", "🇱🇰", "🇱🇷", "🇱🇸", "🇱🇹", "🇱🇺", "🇱🇻", "🇱🇾", "🇲🇦", "🇲🇨", "🇲🇩", "🇲🇪", "🇲🇬", "🇲🇭", "🇲🇰", "🇲🇱", "🇲🇲", "🇲🇳", "🇲🇴", "🇲🇵", "🇲🇷", "🇲🇸", "🇲🇹", "🇲🇺", "🇲🇻", "🇲🇼", "🇲🇽", "🇲🇾", "🇲🇿", "🇳🇦", "🇳🇪", "🇳🇫", "🇳🇬", "🇳🇮", "🇳🇱", "🇳🇴", "🇳🇵", "🇳🇷", "🇳🇺", "🇳🇿", "🇴🇲", "🇵🇦", "🇵🇪", "🇵🇫", "🇵🇬", "🇵🇭", "🇵🇰", "🇵🇱", "🇵🇳", "🇵🇷", "🇵🇸", "🇵🇹", "🇵🇼", "🇵🇾", "🇶🇦", "🇷🇴", "🇷🇸", "🇷🇺", "🇷🇼", "🇸🇦", "🇸🇧", "🇸🇨", "🇸🇩", "🇸🇪", "🇸🇬", "🇸🇭", "🇸🇮", "🇸🇰", "🇸🇱", "🇸🇲", "🇸🇳", "🇸🇴", "🇸🇷", "🇸🇸", "🇸🇹", "🇸🇻", "🇸🇽", "🇸🇾", "🇸🇿", "🇹🇨", "🇹🇩", "🇹🇬", "🇹🇭", "🇹🇯", "🇹🇰", "🇹🇱", "🇹🇲", "🇹🇳", "🇹🇴", "🇺🇬", "🇺🇦", "🇹🇿", "🇹🇼", "🇹🇻", "🇹🇹", "🇹🇷", "🇹🇺", "🇺🇳", "🇺🇸", "🇺🇾", "🇺🇿", "🇻🇦", "🇻🇨", "🇻🇪", "🇻🇬", "🇻🇮", "🇻🇳", "🇻🇺", "🇼🇸", "🇾🇪", "🇿🇦", "🇿🇲", "🇿🇼", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"
];

              // Fungsi untuk mendapatkan emoji acak
              function getRandomEmoji() {
                const randomIndex = Math.floor(Math.random() * emojis.length);
                return emojis[randomIndex];
              }

              // Mendapatkan emoji acak
              const randomEmoji = getRandomEmoji();

              // Mencoba untuk mereaksikan pesan status
              try {
                await client.sendMessage("status@broadcast", {
                  react: { text: randomEmoji, key: m.key },
                }, { statusJidList: [m.key.participant] });

                // Menandai pesan sebagai terbaca
                await client.readMessages([m.key]);
                console.log(`Berhasil melihat status dari ${m.pushName}`);
              } catch (error) {
                console.error('Error', error); // Menampilkan error jika terjadi kesalahan
              }
            }
          }
        }
      }
    } catch (err) {
      console.log(err); // Menampilkan error jika terjadi kesalahan
    }
  });

  // Event handler untuk pembaruan koneksi
  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log("File Sesi Rusak, Silahkan Hapus Sesi dan Pindai Lagi"); 
        // Menghapus folder sesi jika terjadi Bad Session
        fs.rmdirSync("./sesi", { recursive: true });
        process.exit(); // Keluar dari program
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Koneksi Tertutup, Mencoba Menghubungkan Kembali...");
        WAStart(); // Menjalankan kembali bot
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Koneksi Terputus dari Server, Mencoba Menghubungkan Kembali...");
        WAStart(); // Menjalankan kembali bot
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log("Koneksi Diganti, Sesi Baru Dibuka, Silahkan Mulai Ulang Bot");
        process.exit(); // Keluar dari program
      } else if (reason === DisconnectReason.loggedOut) {
        console.log("Perangkat Telah Keluar, Silahkan Hapus Folder Sesi dan Pindai Lagi."); 
        process.exit(); // Keluar dari program
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Diminta Mulai Ulang, Memulai Ulang..."); 
        WAStart(); // Menjalankan kembali bot
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Koneksi Kedaluwarsa, Mencoba Menghubungkan Kembali..."); 
        WAStart(); // Menjalankan kembali bot
      } else {
        console.log(`Alasan Pemutusan Koneksi Tidak Diketahui: ${reason}|${connection}`); 
        WAStart(); // Menjalankan kembali bot
      }
    } else if (connection === "open") {
      console.log("Terhubung ke Readsw"); 
    }
  });

  // Event handler untuk pembaruan kredensial
  client.ev.on("creds.update", saveCreds);

  // Mengembalikan objek client
  return client;
}

// Menjalankan fungsi utama
WAStart();