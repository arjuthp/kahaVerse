const axios = require('axios');
const API_BASE = 'http://localhost:3001/api/v1';

async function test() {
  let token = "";
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      contactNumber: "9809999999",
      password: "password123"
    });
    token = loginRes.data.accessToken;
    console.log("Logged in!");
  } catch (err) {
    console.log("Login err:", err.response ? err.response.data : err.message);
    return;
  }

  try {
    const orderRes = await axios.post(`${API_BASE}/order`, {
      businessId: '7476ee15-1407-41fa-9a49-89e0caaf945d',
      remarks: 'Test order',
      serviceType: 'DINE_IN',
      tableNumber: 'Table 1',
      paymentMethod: 'CASH',
      serviceCharge: 10,
      discountAmount: 0,
      tipAmount: 0,
      orderItems: [{
        quantity: 1,
        menuId: 'daa00b9e-92b9-461b-b7a6-dfbfbcd42ae4',
        menuVariantId: 'ffe3038a-6366-4650-94b2-96cd7f3697b7'
      }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Order Placed:", orderRes.data);
  } catch (err) {
    console.log("Order err:", err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
  }
}
test();
