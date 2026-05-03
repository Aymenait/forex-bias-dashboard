// 🚀 Simple API Server for Products
// يعطي الأسعار الحالية للـ Instagram Bot

const express = require('express');
const cors = require('cors');
const { getAllProducts, getProductById, searchProducts } = require('./products-api.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: '3Ahub Products API',
        version: '1.0.0',
        endpoints: {
            all_products: '/api/products',
            single_product: '/api/products/:id',
            search: '/api/products/search?q=query'
        }
    });
});

// 📦 Get all products
app.get('/api/products', (req, res) => {
    try {
        const data = getAllProducts();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 📝 Get single product by ID
app.get('/api/products/:id', (req, res) => {
    try {
        const product = getProductById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🔍 Search products
app.get('/api/products/search', (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required'
            });
        }

        const results = searchProducts(query);

        res.json({
            success: true,
            query: query,
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Products API Server running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api/products\n`);
});

module.exports = app;
