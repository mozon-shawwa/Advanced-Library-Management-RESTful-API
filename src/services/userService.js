const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config'); 

class UserService {
  
  async registerUser(userData) {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      const err = new Error('Conflict: A user with this email address already exists.');
      err.status = 409; // HTTP 409 Conflict
      throw err;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    const newUser = new User({
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword, 
      role: userData.role || 'user',
      tenantId: userData.tenantId || 'default'
    });

    return await newUser.save();
  }

  async loginUser({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error('Invalid Credentials: The email or password provided is incorrect.');
      err.status = 401; // HTTP 401 Unauthorized
      throw err;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const err = new Error('Invalid Credentials: The email or password provided is incorrect.');
      err.status = 401;
      throw err;
    }

    const payload = {
      id: user._id,
      role: user.role,
      tenantId: user.tenantId
    };

    const secretKey = config.JWT_SECRET || 'super_secret_fallback_key';
    const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });

    return { user, token };
  }

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    return user;
  }
}

module.exports = new UserService();