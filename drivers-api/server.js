const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const drivers = [
  { id: 1, name: 'Alemu Bekele', status: 'Active', location: 'Addis Ababa', hireDate: '2024-01-15' },
  { id: 2, name: 'Yerosen Birhanu', status: 'Inactive', location: 'Bahir Dar', hireDate: '2023-08-30' },
  { id: 3, name: 'Hareg kassaye', status: 'Active', location: 'Dire Dawa', hireDate: '2025-11-10' },
  { id: 4, name: 'Sebli Abebe', status: 'Inactive', location: 'Adama', hireDate: '2024-07-01' },
  { id: 5, name: 'Chaltu Negasa', status: 'Active', location: 'Ambo', hireDate: '2023-02-15' },
  { id: 6, name: 'Sisay Bekele', status: 'Inactive', location: 'Nekemte', hireDate: '2024-06-25' },
  { id: 7, name: 'Motuma Kumsa', status: 'Active', location: 'Harar', hireDate: '2025-09-03' },
  { id: 8, name: 'Nanati Begna', status: 'Active', location: 'Harar', hireDate: '2023-03-26' },
  { id: 9, name: 'Geleta Bekele', status: 'Inactive', location: 'Addis Ababa', hireDate: '2022-11-10' }
];


app.get('/drivers', (req, res) => {
  res.json(drivers);
});
app.get('/', (req, res) => {
    res.send('API is running. Use /drivers for data.');
  });

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
