import {redis} from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken'; 
const generateTokens= (userId) => {
  const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
  return {accessToken, refreshToken};
}
// redis
  const storageRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken,"EX", 7 * 24 * 60 * 60);
  };
  const setcookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
      httpOnly: true, //process xss attacks, cross site scripting attack
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', //prevent CSRF, crosss-site request forgery,
      maxAge: 15 * 60 * 1000, //15 mins
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, //process xss attacks, cross site scripting attack
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', //prevent CSRF, crosss-site request forgery,
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
    });
  };
export const signup = async (req, res) => {
  const {email, password, name } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'This fucking User exits already' });
    }
    const user = await User.create({name, email, password});

    // authentication 
    const {accesToken,refreshToken} = generateTokens(user._id);
    await storageRefreshToken(user._id, refreshToken);

    setcookies(res,accesToken,refreshToken);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role 
    })
  } catch (error) {
    console.log('Error in signup controller', error.message)
    res.status(500).json({message: error.message  });
  }
};

export const login = async (req, res) => {
  try {
    console.log('check 1')
    const {email, password} = req.body;
    const user = await User.findOne({email});
    console.log('check 2')


    if (user && (await user.comparePassword(password))) {
      const {accesToken,refreshToken} =generateTokens(user._id);
      console.log('user is logged in');
      await storageRefreshToken(user._id, refreshToken);
      setcookies(res, accesToken, refreshToken);

      res.json({
          _id: user._id,
          name: user.name,  
          email: user.email,
          role: user.role
      });
    } else {
      res.status(401).json({message: "Invalid credentials"});
    }
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({message: error.message  });
  } 
}

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      await redis.del(`refresh_token:${decoded.userId}`);
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({message: "logout successful"});
  } catch (error) {
    console.log('Error in login controller', error.message);
    res.status(500).json({message: "server error", error: error.message  });
  }
}
