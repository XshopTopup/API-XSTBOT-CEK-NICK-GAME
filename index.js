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

app.get('/api/ml/ganda', async (req, res) => {
  const { userId, zoneId } = req.query;
  
  if (!userId || !zoneId) {
    return res.status(400).json({
      "code": 400,
      "status": "false",
      "creator": "ceknickname.vercel.app",
      "message": "Format Salah! Silakan isi ID dan Zone"
    });
  }

  try {
    const response = await axios.get('https://api.mobapay.com/api/app_shop', {
      params: {
        app_id: 100000,
        user_id: userId,
        server_id: zoneId,
        country: 'ID',
        language: 'en',
        net: 'luckym'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://www.mobapay.com',
        'Referer': 'https://www.mobapay.com/',
        'x-lang': 'en'
      }
    });

    const shopInfo = response.data?.data?.shop_info;
    const items = shopInfo?.good_list || [];
    const username = shopInfo?.user_info?.username || null;

    if (!shopInfo || !username) {
      return res.status(404).json({
        "code": 404,
        "status": "false",
        "creator": "ceknickname.vercel.app",
        "message": "ID tidak ditemukan"
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
      "code": 200,
      "status": "true",
      "creator": "ceknickname.vercel.app",
      "message": "ID berhasil ditemukan",
      "data": {
        "username": username,
        "user_id": userId,
        "zone": zoneId,
        "packages": packages
      }
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({
      "code": 500,
      "status": "false",
      "creator": "ceknickname.vercel.app",
      "message": "Internal Server Error"
    });
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
