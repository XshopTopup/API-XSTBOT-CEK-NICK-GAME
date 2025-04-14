const express = require('express');
const cors = require('cors');
const path = require('path')
const _ = require('lodash');
const { dataGame } = require('./utils/data');
const router = require('./routes');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use('/test', express.static('public'));
app.use(cors());

app.use('/api', router);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/dokumentasi', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'dokumentasi.html'));
});
app.get('/donasi', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'donasi.html'));
});
app.get('/sewa', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'sewa.html'));
});
app.get('/scraping', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'scraping.html'));
});
app.get('/ff-region', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'ff-region.html'));
});
app.post('/ffstalk', async (req, res) => {
   try {
       const { id } = req.body;
       if (!id) {
           return res.status(400).json({ error: "ID tidak boleh kosong." });
       }

       const apiUrl = `https://api.vreden.my.id/api/ffstalk?id=${id}`;
       const response = await axios.get(apiUrl);

       res.status(200).json(response.data);
   } catch (error) {
       console.error("Error saat stalk akun FF:", error.message);
       res.status(500).json({ error: "Gagal mengambil data Free Fire." });
   }
});

// API endpoint to check Mobile Legends first topup packages
app.get("/api/ml-ganda", async (req, res) => {
    try {
        const { id, zone } = req.query;
        if (!id || !zone) {
            return res.status(400).json({
                status: 400,
                creator: "ceknickname.vercel.app",
                message: "Parameter id dan zone wajib diisi.",
            });
        }

        // Call MobaPay API to check first topup availability
        const url = 'https://api.mobapay.com/api/app_shop';
        
        const config = {
            method: 'GET',
            url: url,
            params: {
                app_id: 100000,
                user_id: id,
                server_id: zone,
                country: 'ID',
                language: 'en',
                net: 'luckym'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://www.mobapay.com',
                'Referer': 'https://www.mobapay.com/',
                'x-lang': 'en',
                'Sec-Fetch-Site': 'same-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        };

        const response = await axios.request(config);
        const items = response.data?.data?.shop_info?.good_list || [];

        if (!response.data?.data?.shop_info) {
            return res.status(404).json({
                status: 404,
                creator: "ceknickname.vercel.app",
                message: "ID tidak ditemukan"
            });
        }

        const daftarSku = {
            "com.moonton.diamond_mt_id_50": "50 + 50",
            "com.moonton.diamond_mt_id_150": "150 + 150",
            "com.moonton.diamond_mt_id_250": "250 + 250",
            "com.moonton.diamond_mt_id_500": "500 + 500"
        };

        const packages = [];
        for (const kode in daftarSku) {
            const found = items.find(item => item.sku === kode);
            packages.push({
                package: daftarSku[kode],
                available: found?.game_can_buy ? true : false
            });
        }

        return res.status(200).json({
            status: 200,
            creator: "ceknickname.vercel.app",
            message: "Data First Topup berhasil ditemukan",
            result: {
                username: response.data?.data?.shop_info?.user_name || "Unknown",
                user_id: id,
                zone: zone,
                packages: packages
            }
        });
    } catch (error) {
        console.error("Error saat melakukan ML First Topup Check:", error.message);
        if (error.response) {
            return res.status(error.response.status).json({
                status: error.response.status,
                creator: "ceknickname.vercel.app",
                message: `Kesalahan dari server tujuan: ${error.response.data}`,
            });
        } else if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                status: 504,
                creator: "ceknickname.vercel.app",
                message: "Timeout: API tidak merespons dalam waktu yang ditentukan.",
            });
        } else {
            return res.status(500).json({
                status: 500,
                creator: "ceknickname.vercel.app",
                message: `Terjadi kesalahan: ${error.message}`,
            });
        }
    }
});

app.get('/endpoint', (req, res) => {
   const newDataGame = dataGame.map((item) => {
      return {
         name: item.name,
         slug: item.slug,
         endpoint: `/api/game/${item.slug}`,
         query: `?id=xxxx${item.isZone ? '&zone=xxx' : ''}`,
         hasZoneId: item.isZone ? true : false,
         listZoneId: item.dropdown ? `/api/game/get-zone/${item.slug}` : null,
      };
   });

   return res.json({
      name: 'XSTBot Whatsapp',
      data: _.orderBy(newDataGame, ['name'], ['asc']),
   });
});

app.get('/*', (req, res) => {
   res.status(404).json({ error: 'Error' });
});

app.listen(port, () => {
   console.log(`Example app listening at http://localhost:${port}`);
});

module.exports = app;
