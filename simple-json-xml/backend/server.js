const express = require('express');
const app = express();
const PORT = 8080;

app.use(express.text({ type: 'application/xml' }));

app.post('/request.asmx', (req, res) => {
  console.log('Received XML:', req.body);

  const xmlResponse = `
    <response>
        <status>success</status>
        <price>100.00</price>
    </response>
  `;

  res.set('Content-Type', 'application/xml');
  res.send(xmlResponse);
});

app.listen(PORT, () => {
  console.log(`ADC backend listening on port ${PORT}`);
});
