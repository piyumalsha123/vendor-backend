"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUser = void 0;
const userModel_1 = require("../models/userModel");
const saveUser = async (user) => {
    const { email, name, password } = user;
    // user.email
    const exUser = await userModel_1.UserModel.findOne({ email });
    //   if (exUser) {
    //     return res.status(400).json({ message: "User already exists..!" })
    //   }
    //   // bcrypt
    //   const salt = bcrypt.genSaltSync(10)
    //   const hashedPassword = bcrypt.hashSync(password, salt)
    //   const newUser = new UserModel({
    //     name,
    //     email,
    //     password: hashedPassword,
    //     approved: true
    //   })
    //   const savedUser = await newUser.save()
};
exports.saveUser = saveUser;
