const Tourist = require("../models/Tourist");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// Register
const registerTourist = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    // Check if user exists
    const touristExists = await Tourist.findOne({ email });
    if (touristExists) {
      return res.status(400).json({ message: "Tourist already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new tourist
    const tourist = await Tourist.create({
      name,
      email,
      password: hashedPassword,
    });

    if (tourist) {
      res.status(201).json({
        _id: tourist._id,
        name: tourist.name,
        email: tourist.email,
        token: generateToken(tourist._id),
      });
    } else {
      res.status(400).json({ message: "Invalid tourist data" });
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Login
const loginTourist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const tourist = await Tourist.findOne({ email });
    if (tourist && (await bcrypt.compare(password, tourist.password))) {
      res.json({
        _id: tourist._id,
        name: tourist.name,
        email: tourist.email,
        token: generateToken(tourist._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerTourist, loginTourist };
