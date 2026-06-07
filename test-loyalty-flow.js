const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';
const BUSINESS_ID = '7476ee15-1407-41fa-9a49-89e0caaf945d';

// Menu item details from database
const MARGHERITA_MENU_ID = 'daa00b9e-92b9-461b-b7a6-dfbfbcd42ae4';
const MARGHERITA_VARIANT_ID = 'ffe3038a-6366-4650-94b2-96cd7f3697b7'; // Medium (10") - Price: 650

const VEGGIE_MENU_ID = '76658e42-bb59-43e9-8abe-16348663256b';
const VEGGIE_VARIANT_ID = '26079a04-9b91-44ca-80f2-7cd11ad95039'; // Standard - Price: 380

// Setup 5 distinct customer profiles
const testCustomers = [
  { name: 'Niranjan Shrestha', phone: '9801112221', email: 'niranjan@gmail.com', ordersCount: 1, menuId: MARGHERITA_MENU_ID, variantId: MARGHERITA_VARIANT_ID, qty: 1 }, // 650 spent, New
  { name: 'Aayush Adhikari', phone: '9801112222', email: 'aayush@gmail.com', ordersCount: 2, menuId: VEGGIE_MENU_ID, variantId: VEGGIE_VARIANT_ID, qty: 1 },        // 760 spent, Bronze
  { name: 'Pooja Karki', phone: '9801112223', email: 'pooja@gmail.com', ordersCount: 5, menuId: MARGHERITA_MENU_ID, variantId: MARGHERITA_VARIANT_ID, qty: 1 },     // 3250 spent, Silver
  { name: 'Sameer Dahal', phone: '9801112224', email: 'sameer@gmail.com', ordersCount: 10, menuId: MARGHERITA_MENU_ID, variantId: MARGHERITA_VARIANT_ID, qty: 1 },    // 6500 spent, Gold
  { name: 'Sujata Bhattarai', phone: '9801112225', email: 'sujata@gmail.com', ordersCount: 20, menuId: MARGHERITA_MENU_ID, variantId: MARGHERITA_VARIANT_ID, qty: 1 } // 13000 spent, VIP
];

async function runTest() {
  console.log('============================================================');
  console.log('🚀 STARTING INTEGRATION & REWARDS SYSTEM SIMULATION TEST');
  console.log('============================================================\n');

  for (const customer of testCustomers) {
    console.log(`👤 Processing customer: ${customer.name} (${customer.phone})`);
    
    // 1. Register Customer
    let token = '';
    let userId = '';
    try {
      const regRes = await axios.post(`${API_BASE}/auth/register`, {
        fullName: customer.name,
        contactNumber: customer.phone,
        email: customer.email,
        password: 'password123'
      });
      token = regRes.data.access_token;
      userId = regRes.data.user.id;
      console.log(`   ✅ Registered successfully. User ID: ${userId}`);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log(`   ⚠️ Already registered. Attempting login...`);
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
          contactNumber: customer.phone,
          password: 'password123'
        });
        token = loginRes.data.accessToken;
        userId = loginRes.data.user.id;
        console.log(`   ✅ Logged in successfully. User ID: ${userId}`);
      } else {
        console.error(`   ❌ Registration/Login failed:`, err.message);
        continue;
      }
    }

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Place Orders
    console.log(`   📦 Placing ${customer.ordersCount} orders to simulate order history...`);
    for (let i = 1; i <= customer.ordersCount; i++) {
      try {
        // Create Order
        const orderRes = await axios.post(`${API_BASE}/order`, {
          businessId: BUSINESS_ID,
          remarks: `Order #${i} for loyalty test`,
          serviceType: 'DINE_IN',
          tableNumber: `Table ${i}`,
          paymentMethod: 'CASH',
          serviceCharge: 10,
          discountAmount: 0,
          tipAmount: 0,
          orderItems: [{
            quantity: customer.qty,
            menuId: customer.menuId,
            menuVariantId: customer.variantId
          }]
        }, { headers });

        const orderId = orderRes.data.order.id;
        
        // 3. Update status to delivered (lowercase) to trigger points calculation
        await axios.post(`${API_BASE}/order/${orderId}/change-status`, {
          status: 'delivered'
        }, { headers });

      } catch (err) {
        console.error(`   ❌ Failed to place/deliver order #${i}:`, err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
      }
    }
    console.log(`   ✅ Placed and DELIVERED all ${customer.ordersCount} orders.`);

    // 4. Fetch loyalty ledger & tier info
    try {
      const ledgerRes = await axios.get(`${API_BASE}/loyalty/ledger/${userId}?businessId=${BUSINESS_ID}`);
      const ledger = ledgerRes.data;
      console.log(`   ⭐ Points balance: ${ledger.totalPoints} pts`);
      console.log(`   💰 Lifetime spend: NPR ${Number(ledger.totalSpent).toFixed(2)}`);
      console.log(`   📦 Total orders: ${ledger.totalOrders}`);
      console.log(`   ------------------------------------------`);
    } catch (err) {
      console.error(`   ❌ Failed to fetch ledger:`, err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
    }
  }

  console.log('\n============================================================');
  console.log('📊 SIMULATION COMPLETE');
  console.log('============================================================');
}

runTest();
