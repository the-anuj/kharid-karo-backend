const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userModel = require('./models/userModel');
const Cart = require('./models/cartData')
const Product = require('./models/product')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const axios = require('axios')
require('dotenv').config();
const app = express();

let corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200,
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true // Fix typo
};
app.use(cors(corsOptions)); // Apply CORS options
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(`mongodb://localhost:27017/kharid-karo`)
.then(()=>{
    console.log("connected to database")
}).catch((err)=>{
    console.log(err)
    
})

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      'secret',
      { expiresIn: '1h' }
    );
    res.cookie('token',token)

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
    });
  } catch (error) {
    console.error('Sign-up error:', error);
    res.status(500).json({ error: 'Server error during sign-up' });
  }
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      'secret',
      { expiresIn: '1h' }
    );
    res.status(200).json({
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ error: 'Server error during sign-in' });
  }
});

app.post('/admin/addproduct', async (req, res) => {
    try {
        const { name, price, category, quantity, description, image } = req.body;
        let product = await Product.create({ name, price, category, quantity, description, image });
        // await product.save();
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add product' });
    }
});

app.get('/admin/getproducts', async (req, res) => {
    try {
      const products = await Product.find(); // Fetch all products from the database
      res.status(200).json(products); // Send the products as a JSON response
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });
app.get('/user/getproducts', async (req, res) => {
    try {
      const products = await Product.find(); // Fetch all products from the database
      res.status(200).json(products); // Send the products as a JSON response
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
});
  app.get('/user/getproducts/categories', async (req, res) => {
    try {
      // Fetch products from the API
      const response = await axios.get('http://localhost:5000/user/getproducts');
      const products = response.data;

      // Group products by category and select the first product for each category
      const categoryMap = new Map();
      products.forEach((product) => {
          if (!categoryMap.has(product.category)) {
              categoryMap.set(product.category, product);
          }
      });

      const firstProducts = Array.from(categoryMap.values());

      res.status(200).json(firstProducts);
  } catch (error) {
      console.error('Error fetching or processing products:', error);
      res.status(500).json({ error: 'Failed to fetch or process products' });
  }

});

  app.put('/admin/updatedadminproduct/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
  
    try {
      const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, { new: true });
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update product', error });
    }
  });
  app.delete('/admin/deleteadminproduct/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const deleteProduct = await Product.findByIdAndDelete(id);
      if (!deleteProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(deleteProduct);
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete product', error });
    }
  });

  const authenticateUser = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      console.log(token);
      
      
      if (!token.json()) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      // Verify token only (no DB check)
      const decoded = jwt.verify(token, 'secret');
      req.userId = decoded.userId; // Just attach userId from token
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
  app.get('/cart/:userId', async(req,res)=>{
    try {
      const { userId } = req.params;
      let cart = await Cart.findOne({ userId }).populate({
        path: 'cart.productId',
        select: 'name price image', 
        model: 'Product' 
      });;

      if (!cart) {
        cart = new Cart({
          userId,
          cart: [],
          totalQuantity:0,
          totalPrice: 0,
        });
        await cart.save();
      }
      res.status(200).json({ success: true, cart });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error',error: error.message });
    }
  });
  
  app.post('/cart/:userId/items', async (req, res) => {
    try {
      const { userId } = req.params;
      const { productId, quantity } = req.body;
  
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID' 
        });
      }
  
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid product ID' 
        });
      }
      if (quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          message: 'Quantity must be a number greater than 0' 
        });
      }
  
      // Find or create cart
      let cart = await Cart.findOne({ userId });
  
      if (!cart) {
        cart = new Cart({
          userId,
          cart: [],
          totalQuantity: 0,
          totalPrice: 0
        });
      }
  
      // Check if product already exists in cart
      const existingItemIndex = cart.cart.findIndex(
        item => item.productId.toString() === productId
      );
  
      if (existingItemIndex > -1) {
        // Update existing item
        cart.cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.cart.push({ productId, quantity });
      }
  
      // Calculate totals
      // cart.totalQuantity = cart.cart.producdId.reduce(
      //   (total, item) => total + item.quantity, 0
      // );
      
      // let itemPrice = cart.cart.productId.price/

      cart.totalPrice = cart.cart.productId.reduce(
        (total, item) => total + ( item.producdId.price * item.quantity), 0
      );
  
      await cart.save();
  
      res.status(200).json({
        success: true,
        cart
      });
  
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error.message
      });
    }
  });


app.listen(5000, () => console.log("Server running on port 5000"));