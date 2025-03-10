const axios = require('axios');

const url = 'http://10.10.254.37:3017';

const data = {
  license_key: '12345',
  product_id: 'product-123',
  issued_date: '2024-12-23T00:00:00Z',
  expiry_date: '2025-12-23T00:00:00Z',
  status: 'active',
};

axios
  .post(url, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then((response) => {
    console.log('License created:', response.data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
