const express = require('express');
const fetch = require('node-fetch');
const axios = require('axios');
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

// API endpoint to check Mobile Legends first topup packag
app.get('/api/mlbb/ganda', async (req, res) => {
    const { id, zone } = req.params;
    
    try {
        const mlFirstTopup = await MbFirstTopup(id, zone);
        
        if (mlFirstTopup === null) {
            return res.status(500).json({
                code: 500,
                status: false,
                creator: 'ceknickname.vercel.app',
                message: 'Internal Server Error'
            });
        } else {
            return res.status(200).json({
                code: 200,
                status: true,
                creator: 'ceknickname.vercel.app',
                message: 'First Topup packages retrieved successfully',
                data: {
                    username: mlFirstTopup.username || null,
                    user_id: id,
// API endpoint to check Mobile Legends first topup package
app.get('/api/mlbb/ganda', async (req, res) => {
    // Changed from req.params to req.query since this is a GET request with query parameters
    const { id, zone } = req.query;
    
    // Add validation for required parameters
    if (!id || !zone) {
        return res.status(400).json({
            code: 400,
            status: false,
            creator: 'ceknickname.vercel.app',
            message: 'Missing required parameters: id and zone are required'
        });
    }
    
    try {
        const mlFirstTopup = await MbFirstTopup(id, zone);
        
        if (mlFirstTopup === null) {
            return res.status(500).json({
                code: 500,
                status: false,
                creator: 'ceknickname.vercel.app',
                message: 'Internal Server Error'
            });
        } else if (mlFirstTopup.code === 404) {
            // Pass through the 404 error from the MbFirstTopup function
            return res.status(404).json(mlFirstTopup);
        } else {
            return res.status(200).json({
                code: 200,
                status: true,
                creator: 'ceknickname.vercel.app',
                message: 'First Topup packages retrieved successfully',
                data: {
                    username: mlFirstTopup.username || null,
                    user_id: id,
                    zone: zone || null,
                    packages: mlFirstTopup.packages || mlFirstTopup
                }
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            status: false,
            creator: 'ceknickname.vercel.app',
            message: 'Internal Server Error'
        });
    }
});

// Also modify the MbFirstTopup function to correctly return 404 errors
async function MbFirstTopup(user_id, zone_id) {
    try {
        const res = await fetch(
            `https://api.mobapay.com/api/app_shop?app_id=100000&user_id=${user_id}&server_id=${zone_id}&country=ID&language=en&net=luckym`,
            {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                    'dnt': '1',
                    'x-lang': 'en',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'origin': 'https://www.mobapay.com',
                    'sec-fetch-site': 'same-site',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-dest': 'empty',
                    'referer': 'https://www.mobapay.com/',
                    'accept-language': 'en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7',
                    'priority': 'u=1, i',
                }
            }
        );

        const resJson = await res.json();
        
        // Check if user exists
        if (resJson.code == 0 && resJson.data?.user_info?.code == 0) {
            const items = resJson?.data?.shop_info?.good_list || [];

            const daftarSku = {
                "com.moonton.diamond_mt_id_50": "50 + 50",
                "com.moonton.diamond_mt_id_150": "150 + 150",
                "com.moonton.diamond_mt_id_250": "250 + 250",
                "com.moonton.diamond_mt_id_500": "500 + 500"
            };

            let packageList = [];
            
            for (const kode in daftarSku) {
                const found = items.find(item => item.sku === kode);
                packageList.push({
                    package: daftarSku[kode],
                    available: found?.game_can_buy ? true : false
                });
            }

            return {
                username: resJson.data.user_info.user_name,
                packages: packageList
            };
        } else {
            // Return proper 404 object instead of using res.status
            return {
                code: 404,
                status: false,
                creator: 'ceknickname.vercel.app',
                message: 'ID tidak ditemukan'
            };
        }
    } catch (err) {
        console.log(err);
        return null;
    }
}


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
