const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const userModel = require('./models/userModel');
const cartData = require('./models/cartData')
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
    // 1. Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // 4. Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      'secret',
      { expiresIn: '1h' }
    );

    // 5. Send response (excluding password)
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Sign-up error:', error);
    res.status(500).json({ error: 'Server error during sign-up' });
  }
});

// Sign-In Route (from previous example)
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
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ error: 'Server error during sign-in' });
  }
});


app.post('/admin/addproduct', async (req, res) => {
    try {
        const { name, price, category,quantity, description, image } = req.body;
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

      // Convert the map values to an array
      const firstProducts = Array.from(categoryMap.values());

      // Send the result as a response
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


  app.post('/cart/:id',async(req,res)=>{
    const { id }= req.params;
    try{
      const item = await Product.find()
    }catch(error){}
  })



app.listen(5000, () => console.log("Server running on port 5000"));