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
    try {
        // Changed from req.body to req.query since this is a GET request
        const { user_id, zone_id } = req.query;
        
        if (!user_id || !zone_id) {
            return res.status(400).json({
                code: 400,
                status: false,
                creator: "ceknickname.vercel.app",
                message: "user_id and zone_id are required"
            });
        }

        const result = await checkDiamondPackages(user_id, zone_id);
        
        if (!result) {
            return res.status(404).json({
                code: 404,
                status: false,
                creator: "ceknickname.vercel.app",
                message: "Data not found or error fetching from API"
            });
        }

        res.json({
            code: 200,
            status: true,
            creator: "ceknickname.vercel.app",
            data: result
        });

    } catch (error) {
        console.error('Error in ML Diamond Check endpoint:', error);
        res.status(500).json({
            code: 500,
            status: false,
            creator: "ceknickname.vercel.app",
            message: "Server error"
        });
    }
});

async function checkDiamondPackages(user_id, zone_id) {
    try {
        const response = await axios.get('https://api.mobapay.com/api/app_shop', {
            params: {
                app_id: 100000,
                user_id: user_id,
                server_id: zone_id,
                country: 'ID',
                language: 'en',
                net: 'luckym'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://www.mobapay.com',
                'Referer': 'https://www.mobapay.com/',
                'x-lang': 'en'
            },
            timeout: 10000 // Add timeout to prevent hanging requests
        });

        // Check if the response structure is as expected
        if (!response.data?.data?.shop_info?.good_list) {
            console.error('Unexpected API response structure:', response.data);
            return null;
        }

        const items = response.data.data.shop_info.good_list;

        const diamondPackages = {
            "com.moonton.diamond_mt_id_50": "50 + 50",
            "com.moonton.diamond_mt_id_150": "150 + 150",
            "com.moonton.diamond_mt_id_250": "250 + 250",
            "com.moonton.diamond_mt_id_500": "500 + 500"
        };

        let result = 'Paket First Topup yang tersedia:\n\n';

        // Build the result string
        for (const sku in diamondPackages) {
            const packageItem = items.find(item => item.sku === sku);
            const isAvailable = packageItem?.game_can_buy ? true : false;
            const status = isAvailable ? '✅' : '❌';
            result += `${status} ${diamondPackages[sku]}\n`;
        }

        return result;

    } catch (error) {
        console.error('Error fetching diamond packages:', error.message);
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
