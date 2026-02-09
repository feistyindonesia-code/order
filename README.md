# Food Ordering System

A complete, production-ready static web ordering system built with pure HTML, CSS, and Vanilla JavaScript. This system is designed to be deployed on GitHub Pages and uses Google Apps Script as the backend API.

## 🚀 Features

- **Mobile-First Responsive Design** - Works seamlessly on all devices
- **Real-Time Menu Loading** - Fetches menu items from Google Apps Script
- **Shopping Cart** - Add/remove items with live price calculation
- **Multiple Payment Methods** - Support for QRIS and COD (Cash on Delivery)
- **QRIS Integration** - Generate and display QR codes for payment
- **URL Parameters** - Pre-fill customer information via URL
- **Modern UI/UX** - Dark theme with gradient accents and smooth animations
- **Error Handling** - User-friendly error messages and loading indicators

## 📁 Project Structure

```
/
├── index.html              # Main HTML file
├── Code.gs                 # Google Apps Script backend
├── assets/
│   ├── css/
│   │   └── style.css      # All styling
│   └── js/
│       └── app.js         # Application logic
└── README.md              # This file
```

## 🛠️ Tech Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Apps Script Web App
- **Hosting**: GitHub Pages
- **Font**: Poppins (Google Fonts)

## 📦 Installation & Deployment

### 1. Clone or Download

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Configure Google Apps Script URL

Open `assets/js/app.js` and replace the API URL:

```javascript
const API_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_GAS_URL/exec';
```

Replace `YOUR_ACTUAL_GAS_URL` with your deployed Google Apps Script Web App URL.

### 3. Deploy to GitHub Pages

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to your repository on GitHub
3. Navigate to **Settings** → **Pages**
4. Under **Source**, select **main** branch
5. Click **Save**
6. Your site will be available at: `https://yourusername.github.io/your-repo-name/`

## 🔌 Google Apps Script Backend

### API Endpoints

The backend must implement these endpoints:

#### 1. GET /exec - Fetch Menu
Returns menu items from Google Sheets.

**Response:**
```json
[
  {
    "id": 1,
    "nama": "Feisty Burger",
    "deskripsi": "Burger pedas dengan saus spesial",
    "harga": 25000,
    "kategori": "Makanan",
    "gambar": "https://example.com/image.jpg"
  }
]
```

#### 2. POST /exec - Create QRIS
Generates QRIS payment code.

**Request:**
```json
{
  "action": "create_qris",
  "total": 50000
}
```

**Response:**
```json
{
  "status": "success",
  "trx_id": "TRX123456",
  "qris_url": "https://example.com/qr-code.png"
}
```

#### 3. POST /exec - Save Order
Saves order to Google Sheets.

**Request:**
```json
{
  "action": "save_order",
  "nama": "John Doe",
  "whatsapp": "08123456789",
  "metode": "QRIS",
  "status": "PAID",
  "ref_id": "TRX123456",
  "items": [
    {
      "nama": "Feisty Burger",
      "harga": 25000,
      "qty": 2,
      "subtotal": 50000
    }
  ],
  "total": 50000
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Order saved successfully"
}
```

### Setting Up Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Copy the contents of `Code.gs` to your project
4. Deploy as Web App:
   - Click **Deploy** → **New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (IMPORTANT: This enables CORS)
   - Click **Deploy**
5. Copy the Web App URL and paste it in `assets/js/app.js`
6. If prompted, authorize the script to access Google Sheets

## 🔗 URL Parameters

You can pre-fill customer information using URL parameters:

```
https://yourusername.github.io/your-repo-name/?nama=John%20Doe&wa=08123456789
```

**Parameters:**
- `nama` - Customer name
- `wa` - WhatsApp number

**Example:**
```
https://yourusername.github.io/food-order/?nama=Andi&wa=081234567890
```

## 💳 Payment Flow

### QRIS Payment Flow

1. Customer selects items and adds to cart
2. Customer fills in name and WhatsApp number
3. Customer selects **QRIS** payment method
4. Customer clicks **"Pesan Sekarang"**
5. System requests QRIS from backend
6. Modal displays QR code and total amount
7. Customer scans QR code and pays
8. Customer clicks **"Saya Sudah Bayar"**
9. Order is saved with status **PAID**
10. Success message is displayed

### COD Payment Flow

1. Customer selects items and adds to cart
2. Customer fills in name and WhatsApp number
3. Customer selects **COD** payment method
4. Customer clicks **"Pesan Sekarang"**
5. Order is saved immediately with status **UNPAID**
6. Success message is displayed

## 🎨 Customization

### Colors

Edit `assets/css/style.css` to change the color scheme:

```css
/* Primary gradient */
background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);

/* Dark background */
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
```

### Font

Change the font by editing the Google Fonts import in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

## 🐛 Troubleshooting

### Menu Not Loading (CORS Error)

If you see errors like:
```
Access to fetch has been blocked by CORS policy
Response to preflight request doesn't pass access control check
```

**Solutions:**

1. **Verify Google Apps Script Deployment Settings:**
   - Go to Google Apps Script → Deploy → Manage deployments
   - Make sure "Who has access" is set to **Anyone** (not "Only myself")

2. **Ensure CORS Headers are Set:**
   The `Code.gs` file includes proper CORS headers in the `createResponse()` function:
   ```javascript
   .setHeaders({
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type'
   })
   ```

3. **Don't Open HTML File Directly:**
   - Instead of opening `index.html` from file system (file://)
   - Use a local server: `npx serve` or VS Code Live Server
   - Or deploy to GitHub Pages and test there

4. **Test the API Directly:**
   Visit your Google Apps Script URL in a browser:
   ```
   https://script.google.com/macros/s/YOUR_ID/exec?action=get_menu
   ```
   You should see JSON response without CORS errors.

### QRIS Not Displaying

1. Verify the `create_qris` endpoint is working
2. Check if the response includes `qris_url`
3. Ensure the image URL is accessible

### Order Not Saving

1. Check if the `save_order` endpoint is working
2. Verify all required fields are being sent
3. Check Google Apps Script logs for errors

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security Notes

- Never expose sensitive API keys in frontend code
- Use Google Apps Script's built-in authentication
- Validate all inputs on the backend
- Sanitize user data before storing

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Development

### Local Development

Simply open `index.html` in your browser. However, API calls will only work if:
1. The Google Apps Script is deployed
2. The API URL is configured correctly

### Testing

Test the following scenarios:
- [ ] Menu loads correctly
- [ ] Items can be added/removed from cart
- [ ] Total price calculates correctly
- [ ] URL parameters work
- [ ] QRIS payment flow works
- [ ] COD payment flow works
- [ ] Error messages display correctly
- [ ] Responsive design works on mobile

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using pure HTML, CSS, and JavaScript**